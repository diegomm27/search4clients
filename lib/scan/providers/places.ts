import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { type RawRecord, type ProviderRequest, type ScanOptions, type ScanProvider } from "@/lib/scan/types";

const PLACES_URL = "https://places.googleapis.com/v1/places:textSearch";

export class PlacesProvider implements ScanProvider {
  id = "google-places";
  kind = "api" as const;

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

    // X-Goog-FieldMask must be a comma-joined string with "places." prefixes
    const fieldMask = [
      "places.name",
      "places.displayName",
      "places.formattedAddress",
      "places.location",
      "places.phoneNumber",
      "places.websiteUri",
      "places.regularOpeningHours",
      "places.rating",
      "places.userRatingCount",
      "places.priceLevel",
      "places.types",
      "places.shortDisplayName"
    ].join(",");

    while (pagesFetched < opts.maxPages) {
      await new Promise((r) => setTimeout(r, this.delayMs));

      const body: Record<string, unknown> = {
        query: `${keyword}${locationHint ? `, ${locationHint}` : ""}, ${country}`,
        languageCode: this.detectLanguageCode(country),
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
          "X-Goog-FieldMask": fieldMask
        }
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error(`Google Places error: ${resp.status} ${resp.statusText} — ${text.slice(0, 200)}`);
        break;
      }

      const data = (await resp.json()) as Record<string, unknown>;

      // v1 API returns results under the "places" key, not "results"
      const results = (data.places as Array<Record<string, unknown>>) || [];

      if (results.length === 0) break;

      allResults.push(...this.parsePlaceResults(results));

      pageToken = (data.nextPageToken as string) || undefined;
      pagesFetched++;

      if (!pageToken) break;

      if (opts.cacheDir) {
        await mkdir(opts.cacheDir, { recursive: true });
        await writeFile(cachedPath, JSON.stringify({ places: allResults, nextPageToken: pageToken }, null, 2), "utf8");
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
      const weekdayText = openingHours?.weekdayText as string[] | undefined;
      const placeName = place.name as string | undefined;
      const rating = place.rating as number | undefined;
      const userRatingCount = place.userRatingCount as number | undefined;
      const priceLevel = place.priceLevel as number | undefined;
      const types = (place.types as string[]) || [];
      const shortDisplayName = place.shortDisplayName as Record<string, string> | undefined;

      records.push({
        source_id: "google-places",
        source_url: null,
        name: nameData?.text || placeName || "Unknown",
        address: (place.formattedAddress as string) || null,
        lat: loc?.latitude ?? null,
        lon: loc?.longitude ?? null,
        phone: (place.phoneNumber as string) || null,
        website: (place.websiteUri as string) || null,
        email: null,
        places_id: placeName ? placeName.split("/").pop() || null : null,
        opening_hours: weekdayText?.join("; ") || null,
        description: shortDisplayName?.text || null,
        extra: {
          rating,
          user_rating_count: userRatingCount,
          price_level: priceLevel,
          places_types: types.join(",")
        }
      });
    }

    return records;
  }

  private parseResponse(data: Record<string, unknown>): RawRecord[] {
    // v1 API uses "places" key
    const results = (data.places as Array<Record<string, unknown>>) || [];
    return this.parsePlaceResults(results);
  }
}
