import type { SiteData } from "./fetch";

export type SignalCategory =
  | "has website"
  | "has contact page"
  | "has pricing page"
  | "has blog/news"
  | "has hiring page"
  | "has public email"
  | "has public phone"
  | "has social profiles"
  | "uses analytics"
  | "uses crm"
  | "uses payment"
  | "uses cms"
  | "has geo coordinates"
  | "has opening hours"
  | "has physical address"
  | "enterprise brand";

export function detectSignals(siteData: SiteData): SignalCategory[] {
  const signals: SignalCategory[] = [];

  if (siteData.canonicalUrl) signals.push("has website");
  if (siteData.hasContactPage) signals.push("has contact page");
  if (siteData.hasPricingPage) signals.push("has pricing page");
  if (siteData.hasBlog) signals.push("has blog/news");
  if (siteData.hasHiring) signals.push("has hiring page");
  if (siteData.publicEmail) signals.push("has public email");
  if (siteData.publicPhone) signals.push("has public phone");
  if (Object.keys(siteData.socialProfiles).length > 0) signals.push("has social profiles");

  if (siteData.techHints.includes("google-analytics")) signals.push("uses analytics");
  if (siteData.techHints.some((t) => /hubspot|salesforce|intercom/.test(t))) signals.push("uses crm");
  if (siteData.techHints.includes("stripe")) signals.push("uses payment");
  if (siteData.techHints.some((t) => /wordpress|wix|squarespace|shopify/.test(t))) signals.push("uses cms");

  return signals;
}
