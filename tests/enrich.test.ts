import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

vi.mock("../lib/enrich/fetch", () => ({
  fetchAndParseSite: vi.fn()
}));

import { fetchAndParseSite, type SiteData } from "../lib/enrich/fetch";
import { enrichCandidates } from "../lib/enrich/enrich";

function candidate(name: string, website: string | null) {
  return {
    company_name: name,
    country: "Spain",
    region: null,
    city: null,
    industry: "Dental clinics",
    business_category: "Local Business",
    website,
    contact_page: null,
    public_email: null,
    public_phone: null,
    linkedin_company_page: null,
    social_profiles: [],
    company_description: "",
    observed_signals: [],
    sources: ["https://www.openstreetmap.org/node/1"]
  };
}

function site(overrides: Partial<SiteData> = {}): SiteData {
  return {
    canonicalUrl: "https://ok.es",
    title: null,
    description: null,
    contactPage: null,
    publicEmail: "info@ok.es",
    publicEmails: ["info@ok.es", "ventas@ok.es"],
    publicPhone: null,
    textSample: "",
    pagesRead: ["https://ok.es", "https://ok.es/contacto"],
    hiringPage: null,
    pricingPage: null,
    blogPage: null,
    socialProfiles: {},
    techHints: [],
    hasContactPage: false,
    hasPricingPage: false,
    hasBlog: false,
    hasHiring: false,
    ...overrides
  };
}

describe("enrichCandidates", () => {
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "s4c-enrich-"));
    file = path.join(dir, "candidates.json");
    vi.mocked(fetchAndParseSite).mockReset();
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("keeps going when one site throws, and records the failure for that site only", async () => {
    await writeFile(file, JSON.stringify({ candidates: [candidate("Slow", "https://slow.es"), candidate("Ok", "https://ok.es")] }));
    vi.mocked(fetchAndParseSite).mockImplementation(async (url: string) => {
      if (url.includes("slow")) throw new Error("body timeout");
      return site();
    });

    const results = await enrichCandidates(file, { delayMs: 0, maxConcurrency: 2 });

    expect(results).toHaveLength(2);
    expect(results[0].enrichment_failed).toBe(true);
    expect(results[0].enrichment_notes).toBe("Failed to fetch https://slow.es: body timeout");
    expect(results[1].enrichment_failed).toBe(false);
    expect(results[1].candidate.public_email).toBe("info@ok.es");

    const saved = JSON.parse(await readFile(file, "utf8"));
    expect(saved.candidates.map((c: { company_name: string }) => c.company_name)).toEqual(["Slow", "Ok"]);
  });

  it("adds the pages read to sources and lists the other emails found", async () => {
    await writeFile(file, JSON.stringify({ candidates: [candidate("Ok", "https://ok.es")] }));
    vi.mocked(fetchAndParseSite).mockResolvedValue(site());

    const [result] = await enrichCandidates(file, { delayMs: 0 });

    expect(result.candidate.sources).toEqual([
      "https://www.openstreetmap.org/node/1",
      "https://ok.es",
      "https://ok.es/contacto"
    ]);
    expect(result.signals).toContain("other emails: ventas@ok.es");
  });

  it("keeps the input order with concurrent workers", async () => {
    const names = ["A", "B", "C", "D", "E"];
    await writeFile(file, JSON.stringify({ candidates: names.map((n) => candidate(n, `https://${n.toLowerCase()}.es`)) }));
    vi.mocked(fetchAndParseSite).mockImplementation(async (url: string) => {
      // Earlier sites answer later, so completion order is reversed.
      await new Promise((r) => setTimeout(r, url.startsWith("https://a") ? 30 : 5));
      return site({ canonicalUrl: url, pagesRead: [url] });
    });

    const results = await enrichCandidates(file, { delayMs: 0, maxConcurrency: 4 });

    expect(results.map((r) => r.candidate.company_name)).toEqual(names);
  });
});
