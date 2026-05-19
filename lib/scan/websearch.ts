import { readFile } from "fs/promises";
import { z } from "zod";
import type { CandidateCompany } from "@/lib/search/candidates";

/**
 * Agent web-search provider — ingestion layer.
 *
 * The `npm run scan` pipeline is pure deterministic code with no LLM access.
 * Open-web search is therefore performed by the *agent* (Claude / Gemini CLI),
 * which writes its findings to a JSON file in the schema defined here. This
 * module validates that file and converts it into pipeline candidates.
 *
 * IMPORTANT — web search SAMPLES, it does not ENUMERATE. A search for
 * "bookstores in Badajoz" returns whatever the search engine surfaces, not a
 * complete list. Every record produced here is therefore tagged with a
 * `websearch:` source prefix and a `needs-verification` signal so it is never
 * mistaken for structured, enumerated data from OSM. Downstream scoring and the
 * exported report can surface that distinction to the user.
 */

const WEBSEARCH_SOURCE_PREFIX = "websearch";
const NEEDS_VERIFICATION_SIGNAL = "needs-verification (web-search sourced)";

/** One business the agent extracted from search results. */
const findingSchema = z.object({
  company_name: z.string().min(1),
  /** Sub-region / province the agent searched when it found this business. */
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  public_email: z.string().nullable().optional(),
  public_phone: z.string().nullable().optional(),
  company_description: z.string().default(""),
  /** Free-text signals the agent observed (e.g. "hosts book clubs"). */
  observed_signals: z.array(z.string()).default([]),
  /**
   * The page(s) the agent actually read to extract this business. Required —
   * a finding with no source URL cannot be verified and must not be ingested.
   */
  source_urls: z.array(z.string().min(1)).min(1)
});

export type WebSearchFinding = z.infer<typeof findingSchema>;

/** The file the agent writes after running its province-by-province searches. */
export const webSearchFindingsSchema = z.object({
  generated_by: z.literal("agent-websearch"),
  generated_at: z.string(),
  /** Echo of the request this search was run for — sanity check on merge. */
  request_name: z.string().optional(),
  /** Language the agent searched in (e.g. "es"). Recorded for transparency. */
  search_language: z.string().optional(),
  /** Sub-regions / provinces the agent actually searched. */
  regions_searched: z.array(z.string()).default([]),
  findings: z.array(findingSchema)
});

export type WebSearchFindingsFile = z.infer<typeof webSearchFindingsSchema>;

/** Load and validate an agent-produced findings file. Throws on schema error. */
export async function loadWebSearchFindings(filePath: string): Promise<WebSearchFindingsFile> {
  const raw = await readFile(filePath, "utf8");
  return webSearchFindingsSchema.parse(JSON.parse(raw));
}

/**
 * Convert validated findings into pipeline candidates.
 *
 * Every candidate is tagged so its provenance is unambiguous:
 *  - `sources` carry a `websearch:` prefix on each source URL,
 *  - `observed_signals` always include the `needs-verification` marker.
 */
export function findingsToCandidates(
  file: WebSearchFindingsFile,
  request: { industry: string; country: string }
): CandidateCompany[] {
  return file.findings.map((finding) => ({
    company_name: finding.company_name,
    country: request.country,
    region: finding.region ?? null,
    city: finding.city ?? null,
    industry: request.industry,
    business_category: "Local Business",
    website: finding.website ?? null,
    contact_page: null,
    public_email: finding.public_email ?? null,
    public_phone: finding.public_phone ?? null,
    linkedin_company_page: null,
    social_profiles: [],
    company_description: finding.company_description,
    observed_signals: [...new Set([...finding.observed_signals, NEEDS_VERIFICATION_SIGNAL])],
    sources: finding.source_urls.map((url) => `${WEBSEARCH_SOURCE_PREFIX}:${url}`)
  }));
}

export { WEBSEARCH_SOURCE_PREFIX, NEEDS_VERIFICATION_SIGNAL };
