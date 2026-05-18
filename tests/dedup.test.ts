import { describe, it, expect } from "vitest";
import { deduplicateCandidates } from "../lib/dedup/dedup";
import type { CandidateCompany } from "../lib/search/candidates";

function makeCandidate(overrides: Partial<CandidateCompany> = {}): CandidateCompany {
  return {
    company_name: "Test Co",
    country: "US",
    region: null,
    city: null,
    industry: "tech",
    business_category: "tech",
    website: null,
    contact_page: null,
    public_email: null,
    public_phone: null,
    linkedin_company_page: null,
    social_profiles: [],
    company_description: "",
    observed_signals: [],
    sources: [],
    ...overrides
  };
}

describe("deduplicateCandidates", () => {
  it("removes duplicates by name", () => {
    const candidates = [
      makeCandidate({ company_name: "Acme Corp" }),
      makeCandidate({ company_name: "Acme Corp" })
    ];
    const result = deduplicateCandidates(candidates);
    expect(result.total_deduped).toBe(1);
    expect(result.total_removed).toBe(1);
  });

  it("matches by phone when names differ but phone is same", () => {
    const candidates = [
      makeCandidate({ company_name: "Acme Corp.", country: "US", public_phone: "+1234567890" }),
      makeCandidate({ company_name: "Acme Corp.", country: "US", public_phone: "+1234567890" })
    ];
    const result = deduplicateCandidates(candidates);
    expect(result.total_deduped).toBe(1);
    expect(result.total_removed).toBe(1);
  });

  it("matches by website when names differ but website is same", () => {
    const candidates = [
      makeCandidate({ company_name: "Acme Corp", country: "US", city: "NYC", website: "https://acme.com" }),
      makeCandidate({ company_name: "Acme Corp", country: "US", city: "NYC", website: "https://acme.com" })
    ];
    const result = deduplicateCandidates(candidates);
    expect(result.total_deduped).toBe(1);
    expect(result.total_removed).toBe(1);
  });

  it("keeps distinct companies", () => {
    const candidates = [
      makeCandidate({ company_name: "Acme Corp" }),
      makeCandidate({ company_name: "Beta Inc" })
    ];
    const result = deduplicateCandidates(candidates);
    expect(result.total_deduped).toBe(2);
    expect(result.total_removed).toBe(0);
  });

  it("merges signals from duplicates", () => {
    const candidates = [
      makeCandidate({ company_name: "Acme Corp", observed_signals: ["has website"] }),
      makeCandidate({ company_name: "Acme Corp", observed_signals: ["has phone"] })
    ];
    const result = deduplicateCandidates(candidates);
    expect(result.total_deduped).toBe(1);
    const merged = result.candidates[0];
    expect(merged.observed_signals).toContain("has website");
    expect(merged.observed_signals).toContain("has phone");
  });

  it("handles empty input", () => {
    const result = deduplicateCandidates([]);
    expect(result.total_deduped).toBe(0);
    expect(result.total_removed).toBe(0);
  });

  it("records removed candidates with reasons", () => {
    const candidates = [
      makeCandidate({ company_name: "Acme Corp" }),
      makeCandidate({ company_name: "Acme Corp" })
    ];
    const result = deduplicateCandidates(candidates);
    expect(result.removed.length).toBe(1);
    expect(result.removed[0].company_name).toBe("Acme Corp");
    expect(result.removed[0].reason).toContain("Duplicate");
  });

  it("handles candidates with no dedup key", () => {
    const candidates = [
      makeCandidate({ company_name: "", public_phone: null, website: null, city: null, country: null })
    ];
    const result = deduplicateCandidates(candidates);
    expect(result.total_removed).toBe(1);
    expect(result.total_deduped).toBe(0);
  });
});
