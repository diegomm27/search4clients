import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { readFileSync } from "fs";
import path from "path";
import * as cheerio from "cheerio";
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

    const tagQuery = osmTags.map(([k, v]) => `node["${k}"="${v}"]`).join("");

    // Build area filter: bounding box > city > region > country
    const regionVal = region ?? undefined;
    let areaFilter = this.buildAreaFilter(tagQuery, city, regionVal, countryIso, request.regionBboxes);

    // Use nwr (node/way/relation) + out center to get coordinates from all element types
    const query = `
      [out:json][timeout:60];
      ${areaFilter ? `${tagQuery}${areaFilter}` : `${tagQuery}nwr();`}
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
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "search4clients/1.0"
      }
    });

    if (!resp.ok) {
      console.error(`Overpass error: ${resp.status} ${resp.statusText} — Query: ${query.slice(0, 300)}`);
      return [];
    }

    const contentType = resp.headers.get("content-type") || "";
    let data: Record<string, unknown>;

    if (contentType.includes("application/json") || contentType.includes("text/json")) {
      data = (await resp.json()) as Record<string, unknown>;
    } else {
      const xmlText = await resp.text();
      data = this.parseXmlResponse(xmlText);
    }

    if (opts.cacheDir) {
      await mkdir(opts.cacheDir, { recursive: true });
      await writeFile(cachedPath, JSON.stringify(data, null, 2), "utf8");
    }

    return this.parseResponse(data);
  }

  /**
   * Build area filter for Overpass QL.
   * Uses bounding boxes because OSM area name lookups fail for many regions.
   * Returns only the bbox portion with trailing semicolon (tagQuery is prepended in scan()).
   */
  private buildAreaFilter(
    tagQuery: string,
    city: string | null | undefined,
    region: string | null | undefined,
    countryIso: string,
    regionBboxes?: Record<string, [number, number, number, number]>
  ): string {
    if (region && regionBboxes?.[region]) {
      const [minLat, minLon, maxLat, maxLon] = regionBboxes[region];
      return `(${minLat},${minLon},${maxLat},${maxLon});`;
    }
    if (countryIso) {
      return `(${this.getCountryBbox(countryIso)});`;
    }
    return "";
  }

  /** Return a bounding box string for a country ISO code. */
  private getCountryBbox(iso: string): string {
    // Approximate bounding boxes for major countries
    const bboxes: Record<string, string> = {
      ES: "35.5,-11.5,44.0,4.5",
      DE: "47.0,5.5,55.1,15.2",
      FR: "42.0,-5.2,51.1,8.2",
      IT: "36.5,6.3,47.1,18.6",
      US: "24.0,-125.0,49.0,-66.0",
      GB: "49.9,-8.5,59.4,2.0",
      BR: "-33.8,-73.9,5.3,29.4",
      AR: "-55.1,-73.7,21.8,69.1",
      CA: "41.7,-141.0,83.1,-52.6",
      JP: "24.0,122.0,46.0,146.0",
    };
    return bboxes[iso] || "-90,-180,90,180";
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

  /**
   * Parse Overpass XML response and convert to JSON format expected by parseResponse.
   * Overpass API returns XML by default even when [out:json] is in the query.
   */
  private parseXmlResponse(xmlText: string): Record<string, unknown> {
    const $ = cheerio.load(xmlText, { xmlMode: true });
    const elements: Array<Record<string, unknown>> = [];

    $("node, way").each((_i, el) => {
      const type = $(el).attr("type") || $(el).get(0)?.name || "node";
      const id = Number($(el).attr("id") || 0);
      const lat = $(el).attr("lat");
      const lon = $(el).attr("lon");
      const tags: Record<string, string> = {};

      $(el).find("tag").each((_ti, tag) => {
        const k = $(tag).attr("k");
        const v = $(tag).attr("v");
        if (k && v !== undefined) {
          tags[k] = v;
        }
      });

      const elementObj: Record<string, unknown> = { type, id, tags };
      if (lat) elementObj.lat = Number(lat);
      if (lon) elementObj.lon = Number(lon);
      elements.push(elementObj);
    });

    return { elements };
  }
}
