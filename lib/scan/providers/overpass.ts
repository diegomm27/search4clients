import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { readFileSync } from "fs";
import path from "path";
import type { RawRecord, ProviderRequest, ScanOptions, ScanProvider } from "@/lib/scan/types";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export class OverpassProvider implements ScanProvider {
  id = "overpass";
  kind = "api" as const;

  private cacheDir: string;
  private delayMs: number;

  constructor(opts: { cacheDir: string; delayMs: number }) {
    this.cacheDir = opts.cacheDir;
    this.delayMs = opts.delayMs;
  }

  async scan(request: ProviderRequest, opts: ScanOptions): Promise<RawRecord[]> {
    const { osmTags, city, region, countryIso, industry } = request;
    if (!osmTags || osmTags.length === 0) {
      return [];
    }

    const tagQuery = osmTags.map(([k, v]) => `["${k}"="${v}"];`).join("");

    // Build area filter: country-level area, then layer city/region on top
    const regionVal = region ?? undefined;
    let areaFilter = this.buildAreaFilter(city, regionVal, countryIso);

    // Use nwr (node/way/relation) + out center to get coordinates from all element types
    const query = `
      [out:json][timeout:60];
      ${areaFilter ? `(${tagQuery}${areaFilter});` : `${tagQuery}nwr();`};
      out center qt 5000;
    `.replace(/\s+/g, " ").trim();

    const cacheKey = Buffer.from(query).toString("base64url").slice(0, 64);
    const cachedPath = path.join(opts.cacheDir, `overpass-${cacheKey}.json`);

    if (existsSync(cachedPath)) {
      const raw = await readFile(cachedPath, "utf8");
      const data = JSON.parse(raw) as Record<string, unknown>;
      return this.parseResponse(data);
    }

    await new Promise<void>((r) => setTimeout(r, this.delayMs));

    const resp = await fetch(OVERPASS_URL, {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    if (!resp.ok) {
      console.error(`Overpass error: ${resp.status} ${resp.statusText} — Query: ${query.slice(0, 300)}`);
      return [];
    }

    const data = (await resp.json()) as Record<string, unknown>;

    if (opts.cacheDir) {
      await mkdir(opts.cacheDir, { recursive: true });
      await writeFile(cachedPath, JSON.stringify(data, null, 2), "utf8");
    }

    return this.parseResponse(data);
  }

  /**
   * Build area filter for Overpass QL.
   * Priority: city (admin_level=8) > region (admin_level=4) > country (ISO3166-1 admin_level=2).
   * Areas are nested so the query searches within the smallest valid area.
   */
  private buildAreaFilter(city: string | null | undefined, region: string | null | undefined, countryIso: string): string {
    if (city) {
      return `(area["name"="${city}"]["admin_level"="8"];);`;
    }
    if (region) {
      return `(area["name"="${region}"]["admin_level"="4"];);`;
    }
    if (countryIso) {
      // Use ISO3166-1 for country-level area lookups (admin_level=2)
      return `(area["ISO3166-1"="${countryIso}"]["admin_level"="2"]->.a; nwr(area.a););`;
    }
    return "";
  }

  private parseResponse(data: Record<string, unknown>): RawRecord[] {
    const elements = ((data.elements as Array<Record<string, unknown>>) || []).filter((el: Record<string, unknown>) => el.type === "node" || el.type === "way");
    const records: RawRecord[] = [];

    for (const el of elements) {
      const tags = ((el.tags as Record<string, string>) || {}) as Record<string, string>;
      const elId = el.id as number;
      const elLat = el.lat as number | undefined;
      const elLon = el.lon as number | undefined;

      // Parse addr:* tags into structured fields (Overpass sets these separately from tags.address)
      const addrStreet = tags["addr:street"] || null;
      const addrHousenumber = tags["addr:housenumber"] || null;
      const addrCity = tags["addr:city"] || tags["addr:town"] || tags["addr:village"] || null;
      const addrState = tags["addr:state"] || null;
      const addrPostcode = tags["addr:postcode"] || tags["addr:postal_code"] || null;
      const addrCountry = tags["addr:country"] || null;

      // Build a full address string from addr:* tags, falling back to legacy tags.address
      const addressParts = [addrStreet, addrHousenumber, addrCity, addrPostcode, addrState].filter(Boolean);
      const address = addressParts.length > 0
        ? addressParts.join(", ")
        : (tags.address || "");

      records.push({
        source_id: "osm-overpass",
        source_url: `https://www.openstreetmap.org/${el.type}/${elId}`,
        name: tags.name || tags["name:es"] || tags["name:fr"] || tags["name:de"] || String(elId),
        address: address || null,
        lat: elLat ?? null,
        lon: elLon ?? null,
        phone: tags.phone || tags["contact:phone"] || null,
        website: tags.website || tags["contact:website"] || null,
        email: tags.email || tags["contact:email"] || null,
        osm_id: String(elId),
        opening_hours: tags.opening_hours || null,
        description: tags.description || null,
        // Populate top-level location fields from addr:* tags
        city: addrCity,
        region: addrState,
        country: addrCountry || undefined,
        extra: {
          osm_type: el.type as string,
          shop: tags.shop,
          amenity: tags.amenity,
          tourism: tags.tourism,
          leisure: tags.leisure,
          healthcare: tags.healthcare,
          office: tags.office,
          sport: tags.sport,
          addr_postcode: addrPostcode,
          addr_country: addrCountry
        }
      });
    }

    return records;
  }
}
