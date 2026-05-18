import { describe, it, expect } from "vitest";
import { detectSignals } from "../lib/enrich/signals";
import type { SiteData } from "../lib/enrich/fetch";

function makeSiteData(overrides: Partial<SiteData> = {}): SiteData {
  return {
    canonicalUrl: "https://example.com",
    title: null,
    description: null,
    contactPage: null,
    publicEmail: null,
    publicPhone: null,
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

describe("detectSignals", () => {
  it("detects basic website signal", () => {
    const signals = detectSignals(makeSiteData());
    expect(signals).toContain("has website");
  });

  it("detects contact page signal", () => {
    const signals = detectSignals(makeSiteData({ hasContactPage: true }));
    expect(signals).toContain("has contact page");
  });

  it("detects pricing page signal", () => {
    const signals = detectSignals(makeSiteData({ hasPricingPage: true }));
    expect(signals).toContain("has pricing page");
  });

  it("detects blog signal", () => {
    const signals = detectSignals(makeSiteData({ hasBlog: true }));
    expect(signals).toContain("has blog/news");
  });

  it("detects hiring page signal", () => {
    const signals = detectSignals(makeSiteData({ hasHiring: true }));
    expect(signals).toContain("has hiring page");
  });

  it("detects public email signal", () => {
    const signals = detectSignals(makeSiteData({ publicEmail: "info@example.com" }));
    expect(signals).toContain("has public email");
  });

  it("detects public phone signal", () => {
    const signals = detectSignals(makeSiteData({ publicPhone: "+1234567890" }));
    expect(signals).toContain("has public phone");
  });

  it("detects social profiles signal", () => {
    const signals = detectSignals(makeSiteData({ socialProfiles: { "linkedin.com": "https://linkedin.com/company/test" } }));
    expect(signals).toContain("has social profiles");
  });

  it("detects analytics signal", () => {
    const signals = detectSignals(makeSiteData({ techHints: ["google-analytics"] }));
    expect(signals).toContain("uses analytics");
  });

  it("detects crm signal", () => {
    const signals = detectSignals(makeSiteData({ techHints: ["hubspot"] }));
    expect(signals).toContain("uses crm");
  });

  it("detects payment signal", () => {
    const signals = detectSignals(makeSiteData({ techHints: ["stripe"] }));
    expect(signals).toContain("uses payment");
  });

  it("detects cms signal", () => {
    const signals = detectSignals(makeSiteData({ techHints: ["wordpress"] }));
    expect(signals).toContain("uses cms");
  });

  it("returns multiple signals when present", () => {
    const signals = detectSignals(makeSiteData({
      hasContactPage: true,
      hasPricingPage: true,
      publicEmail: "info@example.com",
      techHints: ["google-analytics", "stripe"]
    }));
    expect(signals.length).toBeGreaterThan(1);
  });

  it("returns only website signal for minimal site data", () => {
    const signals = detectSignals(makeSiteData());
    expect(signals).toEqual(["has website"]);
  });
});
