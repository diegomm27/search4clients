import type { CandidateCompany } from "@/lib/search/candidates";

export type DedupResult = {
  candidates: CandidateCompany[];
  total_input: number;
  total_deduped: number;
  total_removed: number;
  removed: Array<{ index: number; company_name: string; reason: string }>;
  merge_strategy: string;
};

export function deduplicateCandidates(candidates: CandidateCompany[]): DedupResult {
  const keyToCandidate = new Map<string, CandidateCompany>();
  const uniqueCandidates: CandidateCompany[] = [];
  const removed: Array<{ index: number; company_name: string; reason: string }> = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const keys = generateKeys(candidate);

    if (keys.length === 0) {
      removed.push({ index: i, company_name: candidate.company_name, reason: "No dedup key (no name, phone, website, or location)" });
      continue;
    }

    let matchKey: string | null = null;
    for (const key of keys) {
      if (keyToCandidate.has(key)) {
        matchKey = key;
        break;
      }
    }

    if (!matchKey) {
      uniqueCandidates.push(candidate);
      for (const key of keys) {
        keyToCandidate.set(key, candidate);
      }
      continue;
    }

    const existing = keyToCandidate.get(matchKey)!;
    mergeCandidates(existing, candidate);
    removed.push({
      index: i,
      company_name: candidate.company_name,
      reason: `Duplicate of "${existing.company_name}" (matched by ${keys.length} signal(s))`
    });
  }

  return {
    candidates: uniqueCandidates,
    total_input: candidates.length,
    total_deduped: uniqueCandidates.length,
    total_removed: removed.length,
    removed,
    merge_strategy: "name+phone+website+geo"
  };
}

function generateKeys(candidate: CandidateCompany): string[] {
  const name = candidate.company_name?.toLowerCase().trim();
  const phone = candidate.public_phone?.replace(/\D/g, "");
  const website = candidate.website?.toLowerCase().trim();
  const city = candidate.city?.toLowerCase().trim();
  const country = candidate.country?.toLowerCase().trim();

  const keys: string[] = [];

  if (name && phone) keys.push(`${name}|${phone}`);
  if (name && website) keys.push(`${name}|${website}`);
  if (name && city && country) keys.push(`${name}|${city}|${country}`);
  if (phone && website) keys.push(`${phone}|${website}`);
  if (phone && city && country) keys.push(`${phone}|${city}|${country}`);
  if (website && city && country) keys.push(`${website}|${city}|${country}`);

  if (keys.length === 0 && name) keys.push(name);
  if (keys.length === 0 && phone) keys.push(phone);
  if (keys.length === 0 && website) keys.push(website);

  if (phone) keys.push(phone);
  if (website) keys.push(website);

  return keys;
}

function mergeCandidates(existing: CandidateCompany, incoming: CandidateCompany): void {
  const fields: Array<keyof CandidateCompany> = [
    "website", "contact_page", "public_email", "public_phone",
    "linkedin_company_page", "company_description"
  ];

  for (const field of fields) {
    if (!existing[field] && incoming[field]) {
      (existing as Record<string, unknown>)[field] = incoming[field];
    }
  }

  const mergedSignals = [...new Set([...existing.observed_signals, ...incoming.observed_signals])];
  existing.observed_signals = mergedSignals;

  const mergedSources = [...new Set([...existing.sources, ...incoming.sources])];
  existing.sources = mergedSources;

  if (incoming.social_profiles && incoming.social_profiles.length > 0) {
    const existingProfiles = existing.social_profiles || [];
    existing.social_profiles = [...new Set([...existingProfiles, ...incoming.social_profiles])];
  }
}
