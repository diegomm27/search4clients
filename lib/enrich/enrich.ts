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

  const results: EnrichResult[] = [];
  const delayMs = options?.delayMs ?? 500;

  for (let i = 0; i < candidatesToEnrich.length; i++) {
    const candidate = candidatesToEnrich[i];
    if (!candidate.website) {
      results.push({
        candidate,
        signals: [],
        enrichment_failed: true,
        enrichment_notes: "No website URL to enrich."
      });
      continue;
    }

    const siteData = await fetchAndParseSite(candidate.website, { delayMs });

    if (!siteData) {
      results.push({
        candidate,
        signals: [],
        enrichment_failed: true,
        enrichment_notes: `Failed to fetch ${candidate.website}`
      });
      continue;
    }

    const signals = detectSignals(siteData);
    const enrichedSignals = [...new Set([...candidate.observed_signals, ...signals])];

    const enriched: CandidateCompany = {
      ...candidate,
      website: siteData.canonicalUrl || candidate.website,
      contact_page: siteData.contactPage || candidate.contact_page,
      public_email: siteData.publicEmail || candidate.public_email,
      public_phone: siteData.publicPhone || candidate.public_phone,
      observed_signals: enrichedSignals,
      company_description: siteData.description || candidate.company_description
    };

    results.push({
      candidate: enriched,
      signals,
      enrichment_failed: false,
      enrichment_notes: null
    });

    if (i < candidatesToEnrich.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

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
