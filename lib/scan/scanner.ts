import { mkdir, readFile } from "fs/promises";
import path from "path";
import { readFileSync, existsSync } from "fs";
import { type RawRecord, type ScanResult, type CoverageEntry } from "@/lib/scan/types";
import { type SourceEntry, loadSources, filterSources } from "@/lib/scan/sources";
import { OverpassProvider } from "@/lib/scan/providers/overpass";
import { PlacesProvider } from "@/lib/scan/providers/places";
import { DirectoryProvider } from "@/lib/scan/providers/directory";
import type { CandidateCompany } from "@/lib/search/candidates";

type ScanRequest = {
  industry: string;
  country: string;
  countryIso: string;
  region?: string | null;
  city?: string | null;
  categoryId: string;
  cacheDir: string;
  maxPages?: number;
  delayMs?: number;
  /** When true and country has sub-regions, scan each region separately and union results */
  batchByRegion?: boolean;
  /** Bounding boxes for sub-regions: [minLat, minLon, maxLat, maxLon] */
  regionBboxes?: Record<string, [number, number, number, number]>;
};

/** Region mapping for large countries — used for R5 region batching */
const regionMapping: Record<string, string[]> = (() => {
  try {
    const raw = readFileSync("config/region-mapping.json", "utf8");
    return JSON.parse(raw).regions as Record<string, string[]>;
  } catch {
    return {};
  }
})();

/** Default sub-regions for countries without a mapping file */
const defaultRegions: Record<string, string[]> = {
  US: ["California", "Texas", "Florida", "New York", "Pennsylvania", "Illinois", "Ohio", "Georgia", "North Carolina", "Michigan"],
  GB: ["England", "Scotland", "Wales", "Northern Ireland"]
};

export async function runScan(request: ScanRequest): Promise<ScanResult> {
  const sources = await loadSources("config/sources.json");
  const matched = filterSources(sources, request.countryIso, request.categoryId, process.env);

  if (matched.length === 0) {
    console.log("No enabled sources match this country/category. Running with defaults.");
  }

  // Load region bounding boxes if available
  const bboxes = loadRegionBboxes(request.countryIso);

  // Check if we should batch by sub-region
  const shouldBatch = request.batchByRegion && !request.region && !request.city;
  const subRegions = shouldBatch ? getSubRegions(request.countryIso) : null;

  if (shouldBatch && subRegions && subRegions.length > 0) {
    console.log(`Batching by ${subRegions.length} sub-regions for ${request.country}...`);
    return runBatchScan(sources, matched, { ...request, regionBboxes: bboxes }, subRegions);
  }

  return runSingleScan(sources, matched, { ...request, regionBboxes: bboxes });
}

async function runSingleScan(sources: SourceEntry[], matched: SourceEntry[], request: ScanRequest): Promise<ScanResult> {
  const providers = createProviders(matched, request);
  const cacheDir = request.cacheDir || "cache";

  const allRecords: RawRecord[] = [];
  const coverage: CoverageEntry[] = [];

  for (const provider of providers) {
    const providerRequest = buildProviderRequest(request, matched);
    const records = await (provider as any).provider.scan(providerRequest, {
      cacheDir: path.join(cacheDir, provider.id),
      maxPages: request.maxPages || 10,
      delayMs: request.delayMs || 1000
    });

    if (records.length > 0) {
      coverage.push({ source_id: provider.id, count: records.length });
      allRecords.push(...records);
      console.log(`  ${provider.id}: ${records.length} records`);
    } else {
      coverage.push({ source_id: provider.id, count: 0 });
    }
  }

  const deduped = deduplicate(allRecords);
  return { records: deduped, coverage };
}

async function runBatchScan(
  sources: SourceEntry[],
  matched: SourceEntry[],
  baseRequest: ScanRequest,
  subRegions: string[]
): Promise<ScanResult> {
  const allRecords: RawRecord[] = [];
  const coverageMap: Record<string, number> = {};

  for (const region of subRegions) {
    console.log(`  Scanning region: ${region}...`);
    const regionRequest: ScanRequest = {
      ...baseRequest,
      region,
      city: null
    };

    const result = await runSingleScan(sources, matched, regionRequest);

    for (const entry of result.coverage) {
      coverageMap[entry.source_id] = (coverageMap[entry.source_id] || 0) + entry.count;
    }
    allRecords.push(...result.records);
  }

  const coverage = Object.entries(coverageMap).map(([source_id, count]) => ({ source_id, count }));
  console.log(`  Batch complete: ${allRecords.length} total raw records across ${subRegions.length} regions`);

  const deduped = deduplicate(allRecords);
  return { records: deduped, coverage };
}

function getSubRegions(countryIso: string): string[] {
  return regionMapping[countryIso] || defaultRegions[countryIso] || [];
}

/** Load bounding boxes for sub-regions of a country */
function loadRegionBboxes(countryIso: string): Record<string, [number, number, number, number]> {
  try {
    const raw = readFileSync("config/region-bboxes.json", "utf8");
    const data = JSON.parse(raw);
    return data.regions[countryIso] || {};
  } catch {
    return {};
  }
}

function createProviders(sources: SourceEntry[], request: ScanRequest) {
  const providers: Array<{ id: string; provider: { scan(request: any, opts: any): Promise<RawRecord[]> } }> = [];

  const hasOverpass = sources.some((s: SourceEntry) => s.id === "osm-overpass" && s.enabled);
  const hasPlaces = sources.some((s: SourceEntry) => s.id === "google-places" && s.enabled);

  if (hasOverpass) {
    providers.push({
      id: "overpass",
      provider: new OverpassProvider({
        cacheDir: path.join(request.cacheDir, "overpass"),
        delayMs: request.delayMs || 1000
      })
    });
  }

  if (hasPlaces) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (apiKey) {
      providers.push({
        id: "google-places",
        provider: new PlacesProvider(apiKey, {
          cacheDir: path.join(request.cacheDir, "places"),
          delayMs: request.delayMs || 2000
        })
      });
    }
  }

  const hasBrowser = sources.some((s: SourceEntry) => s.kind === "browser" && s.enabled && s.playwright);
  if (hasBrowser) {
    providers.push({
      id: "directory",
      provider: new DirectoryProvider({
        cacheDir: path.join(request.cacheDir, "directory"),
        delayMs: request.delayMs || 1500
      })
    });
  }

  return providers.map((p) => ({ id: p.id, provider: p.provider }));
}

function buildProviderRequest(request: ScanRequest, sources: SourceEntry[]) {
  const taxonomy = loadTaxonomy();
  const category = taxonomy.categories.find((c: any) => c.id === request.categoryId);

  const hasPlaces = sources.some((s: SourceEntry) => s.id === "google-places" && s.enabled);

  return {
    industry: request.industry,
    country: request.country,
    countryIso: request.countryIso,
    region: request.region,
    city: request.city,
    regionBboxes: request.regionBboxes,
    osmTags: category?.osm_tags || [["shop", "books"]],
    placesType: hasPlaces ? (category?.places_type || null) : null,
    placesKeyword: hasPlaces ? (category?.places_keyword || request.industry) : null
  };
}

function loadTaxonomy() {
  const taxonomyPath = "config/taxonomy.json";
  if (!existsSync(taxonomyPath)) {
    return { categories: [] };
  }
  const raw = readFileSync(taxonomyPath, "utf8");
  return JSON.parse(raw);
}

function deduplicate(records: RawRecord[]): RawRecord[] {
  const seen = new Map<string, RawRecord>();

  for (const record of records) {
    const key = dedupKey(record);
    if (!key) continue;

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, record);
    } else {
      mergeRecords(existing, record);
    }
  }

  return Array.from(seen.values());
}

function dedupKey(record: RawRecord): string | null {
  const parts = [
    record.name?.toLowerCase().trim(),
    record.phone?.replace(/\D/g, ""),
    record.website?.toLowerCase().trim(),
    record.lat?.toString(),
    record.lon?.toString()
  ].filter(Boolean);

  if (parts.length === 0) return null;
  return parts.join("|");
}

function mergeRecords(existing: RawRecord, incoming: RawRecord): void {
  const fields: Array<keyof RawRecord> = [
    "address", "phone", "website", "email", "opening_hours", "description", "source_url"
  ];

  for (const field of fields) {
    if (!existing[field] && incoming[field]) {
      (existing as Record<string, unknown>)[field] = incoming[field];
    }
  }

  if (incoming.extra) {
    existing.extra = { ...existing.extra, ...incoming.extra };
  }
}

export function rawRecordsToCandidates(records: RawRecord[], request: { industry: string; country: string; countryIso: string }): CandidateCompany[] {
  return records.map((r) => ({
    company_name: r.name,
    country: r.country || request.country,
    region: r.region || null,
    city: r.city || null,
    industry: request.industry,
    business_category: "Local Business",
    website: r.website || null,
    contact_page: null,
    public_email: r.email || null,
    public_phone: r.phone || null,
    linkedin_company_page: null,
    social_profiles: [],
    company_description: r.description || "",
    observed_signals: extractSignals(r),
    sources: [r.source_url || `source:${r.source_id}:${r.osm_id || r.places_id || "unknown"}`]
  }));
}

function extractSignals(record: RawRecord): string[] {
  const signals: string[] = [];

  if (record.website) signals.push("has website");
  if (record.phone) signals.push("has phone");
  if (record.email) signals.push("has email");
  if (record.opening_hours) signals.push("has opening hours");
  if (record.address) signals.push("has physical address");
  if (record.lat && record.lon) signals.push("has geo coordinates");

  const extra = record.extra || {};
  if (extra.shop || extra.amenity || extra.healthcare || extra.leisure || extra.office) {
    signals.push(`OSM type: ${extra.shop || extra.amenity || extra.healthcare || extra.leisure || extra.office}`);
  }

  return signals;
}
