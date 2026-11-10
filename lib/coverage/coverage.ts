import type { CoverageEntry } from "@/lib/scan/types";

export type SourceCoverage = {
  source_id: string;
  /** Raw records the source returned (before dedup). */
  count: number;
  /** Share of all raw records contributed by this source, 0-100. */
  share_percentage: number;
};

export type SourceOverlap = {
  source_a: string;
  source_b: string;
  /**
   * Records both sources would be expected to share if they sampled the
   * population independently: n_a * n_b / estimated_population.
   */
  expected_overlap: number;
};

export type CoverageReport = {
  /** Unique companies after dedup. */
  total_unique: number;
  /** Raw records across all sources, before dedup. */
  total_raw: number;
  /**
   * Estimated number of companies that exist, found or not. Capture-recapture
   * (Chapman estimator) when two or more sources returned records; otherwise
   * no estimate is possible and the raw record count is used.
   */
  estimated_population: number;
  /** Whether estimated_population comes from capture-recapture. */
  is_estimate: boolean;
  /** total_unique / estimated_population, 0-100. */
  coverage_percentage: number;
  sources: SourceCoverage[];
  /** One entry per pair of sources. */
  source_overlap: SourceOverlap[];
  /** One-line summary for exports: "N companies found across M sources." */
  summary: string;
};

/**
 * Estimate how much of the real population a scan found.
 *
 * Capture-recapture treats each source as an independent "capture": the more
 * the sources overlap (duplicates removed by dedup), the closer the scan is to
 * finding everything. With sources A (largest) and B (all others pooled) and
 * m = total_raw - total_unique duplicates, the Chapman estimator gives
 * N = (n_a + 1)(n_b + 1) / (m + 1) - 1.
 */
export function generateCoverageReport(coverage: CoverageEntry[], totalUnique: number): CoverageReport {
  const totalRaw = coverage.reduce((sum, entry) => sum + Math.max(0, entry.count), 0);
  const active = coverage.filter((entry) => entry.count > 0);

  const { population, isEstimate } = estimatePopulation(active, totalRaw, totalUnique);
  const coveragePercentage = population > 0 ? round1(Math.min(100, (totalUnique / population) * 100)) : 0;

  const sources: SourceCoverage[] = coverage.map((entry) => ({
    source_id: entry.source_id,
    count: entry.count,
    share_percentage: totalRaw > 0 ? round1((Math.max(0, entry.count) / totalRaw) * 100) : 0
  }));

  const sourceOverlap: SourceOverlap[] = [];
  for (let i = 0; i < coverage.length; i++) {
    for (let j = i + 1; j < coverage.length; j++) {
      const a = coverage[i];
      const b = coverage[j];
      const expected = population > 0 && a.count > 0 && b.count > 0 ? Math.round((a.count * b.count) / population) : 0;
      sourceOverlap.push({ source_a: a.source_id, source_b: b.source_id, expected_overlap: expected });
    }
  }

  const sourceLabel = active.length === 1 ? "source" : "sources";
  return {
    total_unique: totalUnique,
    total_raw: totalRaw,
    estimated_population: population,
    is_estimate: isEstimate,
    coverage_percentage: coveragePercentage,
    sources,
    source_overlap: sourceOverlap,
    summary: `${totalUnique} companies found across ${active.length} ${sourceLabel}.`
  };
}

function estimatePopulation(
  active: CoverageEntry[],
  totalRaw: number,
  totalUnique: number
): { population: number; isEstimate: boolean } {
  if (active.length < 2) {
    return { population: totalRaw, isEstimate: false };
  }

  const sorted = [...active].sort((x, y) => y.count - x.count);
  const nA = sorted[0].count;
  const nB = sorted.slice(1).reduce((sum, entry) => sum + entry.count, 0);
  // Duplicates removed by dedup; can't exceed the smaller capture.
  const recaptured = Math.min(Math.max(0, totalRaw - totalUnique), nA, nB);

  const chapman = ((nA + 1) * (nB + 1)) / (recaptured + 1) - 1;
  // Never estimate fewer companies than were actually found.
  return { population: Math.max(totalUnique, Math.round(chapman)), isEstimate: true };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
