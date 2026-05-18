export type RawRecord = {
  source_id: string;
  source_url?: string | null;
  name: string;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  address?: string | null;
  lat?: number | null;
  lon?: number | null;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  osm_id?: string | null;
  places_id?: string | null;
  opening_hours?: string | null;
  description?: string | null;
  extra?: Record<string, string | number | boolean | null | undefined>;
};

export type CoverageEntry = {
  source_id: string;
  count: number;
};

export type ScanResult = {
  records: RawRecord[];
  coverage: CoverageEntry[];
};

export interface ScanProvider {
  id: string;
  kind: "api" | "browser";
  scan(request: ProviderRequest, opts: ScanOptions): Promise<RawRecord[]>;
}

export type ProviderRequest = {
  industry: string;
  country: string;
  countryIso: string;
  region?: string | null;
  city?: string | null;
  osmTags?: Array<[string, string]>;
  placesType?: string | null;
  placesKeyword?: string | null;
};

export type ScanOptions = {
  cacheDir: string;
  maxPages: number;
  delayMs: number;
};
