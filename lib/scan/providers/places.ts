import { readFile, writeFile, mkdir, existsSync } from "fs/promises";
import path from "path";
import { type RawRecord, type ProviderRequest, type ScanOptions, type ScanProvider } from "@/lib/scan/types";

const PLACES_URL = "https://places.googleapis.com/v1/places:textSearch";

export class PlacesProvider implements ScanProvider {
  id = "google-places";
  kind = "api";

  private apiKey: string;
  private cacheDir: string;
  private delayMs: number;

  constructor(apiKey: string, opts: { cacheDir: string; delayMs: number }) {
    this.apiKey = apiKey;
    this.cacheDir = opts.cacheDir;
    this.delayMs = opts.delayMs;
  }

  async scan(request: ProviderRequest, opts: ScanOptions): Promise<RawRecord[]> {
    const keyword = request.placesKeyword || request.industry;
    const locationHint = request.city || request.region;
    const country = request.countryIso;

    const cacheKey = [keyword, locationHint, country].filter(Boolean).join("--");
    const cachedPath = path.join(opts.cacheDir, `places-${Buffer.from(cacheKey).toString("base64url").slice(0, 48)}.json`);

    if (existsSync(cachedPath)) {
      const raw = await readFile(cachedPath, "utf8");
      return this.parseResponse(JSON.parse(raw));
    }

    const allResults: RawRecord[] = [];
    let pageToken: string | undefined;
    let pagesFetched = 0;

    while (pagesFetched < opts.maxPages) {
      await new Promise((r) => setTimeout(r, this.delayMs));

      const body: Record<string, unknown> = {
        query: `${keyword}${locationHint ? `, ${locationHint}` : ""}, ${country}`,
        languageCode: this.detectLanguageCode(country),
        fields: ["name", "displayName", "formattedAddress", "location", "phoneNumber", "websiteUri", "regularOpeningHours", "rating"],
        regionCode: country
      };

      if (pageToken) {
        body.pageToken = pageToken;
      }

      const resp = await fetch(PLACES_URL, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": body.fields as string[]
        }
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error(`Google Places error: ${resp.status} ${resp.statusText} — ${text.slice(0, 200)}`);
        break;
      }

      const data = await resp.json();
      const results = (data.results as Array<Record<string, unknown>>) || [];

      if (results.length === 0) break;

      allResults.push(...this.parsePlaceResults(results));

      pageToken = (data.nextPageToken as string) || undefined;
      pagesFetched++;

      if (!pageToken) break;

      if (opts.cacheDir) {
        await mkdir(opts.cacheDir, { recursive: true });
        await writeFile(cachedPath, JSON.stringify({ results: allResults, nextPageToken: pageToken }, null, 2), "utf8");
      }
    }

    return allResults;
  }

  private detectLanguageCode(country: string): string {
    const map: Record<string, string> = {
      ES: "es", FR: "fr", DE: "de", IT: "it", PT: "pt",
      AR: "es", MX: "es", CO: "es", CL: "es", PE: "es",
      US: "en", GB: "en", AU: "en", CA: "en", NZ: "en",
      JP: "ja", CN: "zh-CN", KR: "ko", BR: "pt"
    };
    return map[country] || "en";
  }

  private parsePlaceResults(results: Array<Record<string, unknown>>): RawRecord[] {
    const records: RawRecord[] = [];

    for (const place of results) {
      const nameData = place.displayName as Record<string, string> | undefined;
      const loc = place.location as Record<string, number> | undefined;
      const openingHours = place.regularOpeningHours as Record<string, unknown> | undefined;
      const regularHours = openingHours?.periods as Array<Record<string, unknown>> | undefined;
      const weekdayText = openingHours?.weekdayText as string[] | undefined;

      records.push({
        source_id: "google-places",
        source_url: null,
        name: nameData?.text || place.name || "Unknown",
        address: (place.formattedAddress as string) || null,
        lat: loc?.latitude ?? null,
        lon: loc?.longitude ?? null,
        phone: (place.phoneNumber as string) || null,
        website: (place.websiteUri as string) || null,
        email: null,
        places_id: place.name ? place.name.split("/").pop() || null : null,
        opening_hours: weekdayText?.join("; ") || null,
        description: null,
        extra: {
          rating: place.rating,
          user_ratings_total: place.userRatingsTotal
        }
      });
    }

    return records;
  }

  private parseResponse(data: Record<string, unknown>): RawRecord[] {
    const results = (data.results as Array<Record<string, unknown>>) || [];
    return this.parsePlaceResults(results);
  }
}
