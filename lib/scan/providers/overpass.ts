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

    const tagQuery = osmTags.map(([k, v]) => `nwr["${k}"="${v}"]`).join("");

    // Build area filter: region area > country area > region bbox > nothing
    const regionVal = region ?? undefined;
    const regionIso = request.regionIso ?? undefined;
    const { preamble, suffix } = this.buildAreaFilter(regionVal, regionIso, countryIso, request.regionBboxes);

    // Use nwr (node/way/relation) + out center to get coordinates from all element types
    const query = `
      [out:json][timeout:60];
      ${preamble}
      ${suffix ? `${tagQuery}${suffix}` : `${tagQuery}nwr();`}
      out center qt;
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
   * Prefers real administrative boundaries (Overpass areas keyed by ISO 3166
   * codes) over bounding boxes: bboxes of regions and countries always bleed
   * into neighboring areas (e.g. the La Rioja bbox includes Soria and Viana).
   * Returns the preamble statement to place before the tag query and the
   * suffix to append to it (bbox filter, empty when nothing applies).
   */
  private buildAreaFilter(
    region: string | null | undefined,
    regionIso: string | null | undefined,
    countryIso: string,
    regionBboxes?: Record<string, [number, number, number, number]>
  ): { preamble: string; suffix: string } {
    if (region && regionIso) {
      return {
        preamble: `area["ISO3166-2"="${regionIso}"]->.searchArea;`,
        suffix: "(area.searchArea);"
      };
    }
    if (region && regionBboxes?.[region]) {
      const [minLat, minLon, maxLat, maxLon] = regionBboxes[region];
      return { preamble: "", suffix: `(${minLat},${minLon},${maxLat},${maxLon});` };
    }
    if (countryIso) {
      return {
        preamble: `area["ISO3166-1"="${countryIso}"]->.searchArea;`,
        suffix: "(area.searchArea);"
      };
    }
    return { preamble: "", suffix: "" };
  }

  private parseResponse(data: Record<string, unknown>): RawRecord[] {
    const elements = ((data.elements as Array<Record<string, unknown>>) || []).filter((el: Record<string, unknown>) => el.type === "node" || el.type === "way" || el.type === "relation");
    const records: RawRecord[] = [];

    for (const el of elements) {
      const tags = ((el.tags as Record<string, string>) || {}) as Record<string, string>;
      const elId = el.id as number;
      // For ways and relations, use center coordinates from 'out center'
      const elLat = (el.center as any)?.lat ?? (el.lat as number | undefined);
      const elLon = (el.center as any)?.lon ?? (el.lon as number | undefined);

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
          addr_country: addrCountry,
          // `brand` marks OSM locations that belong to a chain or franchise
          // (chains tag brand + brand:wikidata); operator is the parent brand
          // for franchisees. Used downstream to detect and exclude chains.
          brand: tags.brand,
          operator: tags.operator
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

    $("node, way, relation").each((_i, el) => {
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

      // Extract center coordinates if present (from 'out center')
      const centerElem = $(el).find("center");
      if (centerElem.length > 0) {
        const centerLat = centerElem.attr("lat");
        const centerLon = centerElem.attr("lon");
        if (centerLat && centerLon) {
          elementObj.center = { lat: Number(centerLat), lon: Number(centerLon) };
        }
      }

      elements.push(elementObj);
    });

    return { elements };
  }
}
