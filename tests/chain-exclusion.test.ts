import { describe, it, expect } from "vitest";
import { evaluateCandidate } from "../lib/evaluate/evaluate";
import { rawRecordsToCandidates } from "../lib/scan/scanner";
import type { RawRecord } from "../lib/scan/types";
import type { SearchConfig } from "../lib/search/schemas";
import type { CandidateCompany } from "../lib/search/candidates";

function makeConfig(excludeSignals: string[] = []): SearchConfig {
  return {
    name: "test-request",
    country: "Spain",
    region: null,
    city: null,
    language: null,
    industry: "Dental clinics",
    service_offered: "Website redesign",
    target_client_type: null,
    ideal_client_signals: [],
    exclude_signals: excludeSignals,
    desired_public_data: [],
    minimum_score: 20
  };
}

function makeCandidate(overrides: Partial<CandidateCompany> = {}): CandidateCompany {
  return {
    company_name: "Clinica Test",
    country: "Spain",
    region: null,
    city: null,
    industry: "Dental clinics",
    business_category: "Local Business",
    website: null,
    contact_page: null,
    public_email: null,
    public_phone: null,
    linkedin_company_page: null,
    social_profiles: [],
    company_description: "",
    observed_signals: [],
    sources: ["https://example.com"],
    ...overrides
  };
}

function makeRecord(overrides: Partial<RawRecord> = {}): RawRecord {
  return {
    source_id: "osm-overpass",
    name: "Clinica Test",
    ...overrides
  };
}

describe("chain detection from OSM brand tags", () => {
  it("adds a chain signal when the record has a brand tag", () => {
    const candidates = rawRecordsToCandidates(
      [makeRecord({ extra: { brand: "Dentix", operator: "Dentix" } })],
      { industry: "Dental clinics", country: "Spain", countryIso: "ES" }
    );
    expect(candidates[0].observed_signals).toContainEqual("chain (osm brand: Dentix)");
  });

  it("does not add a chain signal without a brand tag", () => {
    const candidates = rawRecordsToCandidates(
      [makeRecord({ extra: { operator: "Clinica Test S.L." } })],
      { industry: "Dental clinics", country: "Spain", countryIso: "ES" }
    );
    expect(candidates[0].observed_signals.some((s) => s.startsWith("chain"))).toBe(false);
  });
});

describe("chain exclusion via exclude_signals", () => {
  it("excludes chain candidates when exclude_signals mentions chains", () => {
    const result = evaluateCandidate(makeConfig(["large chains, franchises"]), makeCandidate({
      company_name: "Dentix",
      observed_signals: ["chain (osm brand: Dentix)"]
    }));
    expect(result.score).toBeLessThanOrEqual(12);
    expect(result.reason_for_fit).toContain("Excluded");
    expect(result.reason_for_fit).toContain("chain");
  });

  it("excludes franchise candidates when exclude_signals mentions franchises", () => {
    const result = evaluateCandidate(makeConfig(["franchises"]), makeCandidate({
      company_name: "Vitaldent",
      observed_signals: ["chain (osm brand: Vitaldent)"]
    }));
    expect(result.score).toBeLessThanOrEqual(12);
  });

  it("does not exclude an independent clinic for chain exclusion terms", () => {
    const result = evaluateCandidate(makeConfig(["large chains, franchises"]), makeCandidate({
      company_name: "Clinica Dental Valvanera",
      observed_signals: ["has website", "OSM type: dentist"]
    }));
    expect(result.reason_for_fit).not.toContain("Excluded");
    expect(result.score).toBeGreaterThan(12);
  });

  it("does not exclude chains when exclude_signals has no chain terms", () => {
    const result = evaluateCandidate(makeConfig(["hospital groups"]), makeCandidate({
      company_name: "Dentix",
      observed_signals: ["chain (osm brand: Dentix)"]
    }));
    expect(result.reason_for_fit).not.toContain("Excluded");
  });

  it("still excludes by direct substring match on name/description", () => {
    const result = evaluateCandidate(makeConfig(["Hospital Group"]), makeCandidate({
      company_name: "Clinica Test",
      company_description: "Part of the biggest Hospital Group in Spain"
    }));
    expect(result.reason_for_fit).toContain("Excluded");
    expect(result.reason_for_fit).toContain("Hospital Group");
  });
});
