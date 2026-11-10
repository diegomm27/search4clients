import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { candidatesFileSchema, type CandidateCompany } from "@/lib/search/candidates";
import { fetchAndParseSite } from "./fetch";
import { detectSignals } from "./signals";

export type EnrichResult = {
  candidate: CandidateCompany;
  signals: string[];
  enrichment_failed: boolean;
  enrichment_notes: string | null;
};

export async function enrichCandidates(
  candidatesPath: string,
  options?: { maxConcurrency?: number; delayMs?: number; maxCandidates?: number }
): Promise<EnrichResult[]> {
  if (!existsSync(candidatesPath)) {
    throw new Error(`Candidates file not found: ${candidatesPath}`);
  }

  const raw = await readFile(candidatesPath, "utf8");
  const parsed = candidatesFileSchema.parse(JSON.parse(raw));
  const candidates = parsed.candidates;

  // Limit enrichment to top N candidates for performance
  const maxCandidates = options?.maxCandidates ?? candidates.length;
  const candidatesToEnrich = candidates.slice(0, maxCandidates);

  const delayMs = options?.delayMs ?? 500;
  const concurrency = Math.max(1, options?.maxConcurrency ?? 4);
  const results: EnrichResult[] = new Array(candidatesToEnrich.length);
  let next = 0;
  let done = 0;

  async function enrichOne(candidate: CandidateCompany): Promise<EnrichResult> {
    if (!candidate.website) {
      return { candidate, signals: [], enrichment_failed: true, enrichment_notes: "No website URL to enrich." };
    }

    let siteData: Awaited<ReturnType<typeof fetchAndParseSite>> = null;
    try {
      siteData = await fetchAndParseSite(candidate.website, { delayMs });
    } catch (err) {
      // A slow body or a reset connection must not abort the whole run.
      const reason = err instanceof Error ? err.message : String(err);
      return { candidate, signals: [], enrichment_failed: true, enrichment_notes: `Failed to fetch ${candidate.website}: ${reason}` };
    }
    if (!siteData) {
      return { candidate, signals: [], enrichment_failed: true, enrichment_notes: `Failed to fetch ${candidate.website}` };
    }

    const signals: string[] = detectSignals(siteData);
    const otherEmails = siteData.publicEmails.filter((e) => e !== (siteData.publicEmail || candidate.public_email));
    if (otherEmails.length > 0) signals.push(`other emails: ${otherEmails.slice(0, 3).join(", ")}`);
    const enrichedSignals = [...new Set([...candidate.observed_signals, ...signals])];

    const enriched: CandidateCompany = {
      ...candidate,
      website: siteData.canonicalUrl || candidate.website,
      contact_page: siteData.contactPage || candidate.contact_page,
      public_email: siteData.publicEmail || candidate.public_email,
      public_phone: siteData.publicPhone || candidate.public_phone,
      observed_signals: enrichedSignals,
      company_description: siteData.description || candidate.company_description,
      sources: [...new Set([...candidate.sources, ...siteData.pagesRead])]
    };
    return { candidate: enriched, signals, enrichment_failed: false, enrichment_notes: null };
  }

  async function worker() {
    while (next < candidatesToEnrich.length) {
      const i = next++;
      results[i] = await enrichOne(candidatesToEnrich[i]);
      done++;
      if (done % 25 === 0 || done === candidatesToEnrich.length) {
        console.log(`  enrich: ${done}/${candidatesToEnrich.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, candidatesToEnrich.length) }, worker));

  // Preserve non-enriched candidates (beyond the top N)
  const nonEnriched = candidates.slice(maxCandidates);
  const enrichedCandidates = [...results.map((r) => r.candidate), ...nonEnriched];

  await writeFile(
    candidatesPath,
    JSON.stringify({ generated_by: "search4clients-enrich", generated_at: new Date().toISOString(), candidates: enrichedCandidates }, null, 2),
    "utf8"
  );

  return results;
}
