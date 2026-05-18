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

    let areaFilter = "";
    if (city) {
      areaFilter = `(area["name"="${city}"]["admin_level"="8"];);`;
    } else if (region) {
      areaFilter = `(area["name"="${region}"]["admin_level"="4"];);`;
    }

    const query = `
      [out:json][timeout:60];
      ${areaFilter ? `(${tagQuery}area${areaFilter});` : `${tagQuery}();`};
      out body qt 5000;
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
      console.error(`Overpass error: ${resp.status} ${resp.statusText}`);
      return [];
    }

    const data = (await resp.json()) as Record<string, unknown>;

    if (opts.cacheDir) {
      await mkdir(opts.cacheDir, { recursive: true });
      await writeFile(cachedPath, JSON.stringify(data, null, 2), "utf8");
    }

    return this.parseResponse(data);
  }

  private parseResponse(data: Record<string, unknown>): RawRecord[] {
    const elements = ((data.elements as Array<Record<string, unknown>>) || []).filter((el: Record<string, unknown>) => el.type === "node" || el.type === "way");
    const records: RawRecord[] = [];

    for (const el of elements) {
      const tags = ((el.tags as Record<string, string>) || {}) as Record<string, string>;
      const addr = tags.address || "";
      const elId = el.id as number;
      const elLat = el.lat as number | undefined;
      const elLon = el.lon as number | undefined;

      records.push({
        source_id: "osm-overpass",
        source_url: `https://www.openstreetmap.org/${el.type}/${elId}`,
        name: tags.name || tags["name:es"] || tags["name:fr"] || tags["name:de"] || String(elId),
        address: addr || null,
        lat: elLat ?? null,
        lon: elLon ?? null,
        phone: tags.phone || tags["contact:phone"] || null,
        website: tags.website || tags["contact:website"] || null,
        email: tags.email || tags["contact:email"] || null,
        osm_id: String(elId),
        opening_hours: tags.opening_hours || null,
        description: tags.description || null,
        extra: {
          osm_type: el.type as string,
          shop: tags.shop,
          amenity: tags.amenity,
          tourism: tags.tourism,
          leisure: tags.leisure,
          healthcare: tags.healthcare,
          office: tags.office,
          sport: tags.sport
        }
      });
    }

    return records;
  }
}
