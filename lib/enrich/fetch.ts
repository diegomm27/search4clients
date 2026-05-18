import * as cheerio from "cheerio";

export type SiteData = {
  canonicalUrl: string | null;
  title: string | null;
  description: string | null;
  contactPage: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  hiringPage: string | null;
  pricingPage: string | null;
  blogPage: string | null;
  socialProfiles: Record<string, string>;
  techHints: string[];
  hasContactPage: boolean;
  hasPricingPage: boolean;
  hasBlog: boolean;
  hasHiring: boolean;
};

const COMMON_DELAY_MS = 1000;

export async function fetchAndParseSite(
  url: string,
  options?: { delayMs?: number }
): Promise<SiteData | null> {
  const delayMs = options?.delayMs ?? COMMON_DELAY_MS;
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
    normalizedUrl = "https://" + normalizedUrl;
  }

  let response: Response;
  try {
    response = await fetch(normalizedUrl, {
      signal: AbortSignal.timeout(15000)
    });
  } catch {
    return null;
  }

  if (!response.ok || response.status >= 400) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
    return null;
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const canonicalUrl = $("link[rel='canonical']").attr("href") || normalizedUrl;
  const title = $("title").text().trim() || null;

  const metaDesc = $('meta[name="description"]').attr("content") || null;
  const ogDesc = $('meta[property="og:description"]').attr("content") || null;
  const description = metaDesc || ogDesc || null;

  const contactPage = findContactPage($, canonicalUrl);
  const pricingPage = findPricingPage($, canonicalUrl);
  const blogPage = findBlogPage($, canonicalUrl);
  const hiringPage = findHiringPage($, canonicalUrl);

  const socialProfiles: Record<string, string> = {};
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const domain = extractSocialDomain(href);
    if (domain) {
      socialProfiles[domain] = href.startsWith("http") ? href : `https://${href}`;
    }
  });

  const techHints = extractTechHints($, html);

  const bodyText = $("body").text().toLowerCase();
  const publicEmail = extractEmails(html);
  const publicPhone = extractPhones(html);

  return {
    canonicalUrl,
    title,
    description,
    contactPage,
    publicEmail,
    publicPhone,
    hiringPage,
    pricingPage,
    blogPage,
    socialProfiles,
    techHints,
    hasContactPage: Boolean(contactPage),
    hasPricingPage: Boolean(pricingPage),
    hasBlog: Boolean(blogPage),
    hasHiring: Boolean(hiringPage)
  };
}

function findContactPage($: cheerio.CheerioAPI, baseUrl: string): string | null {
  const paths = ["/contact", "/contact-us", "/contact-us/", "/get-in-touch", "/contacto", "/contacto/"];
  for (const path of paths) {
    const href = $(`a[href="${path}"], a[href*="${path}"]`).first().attr("href");
    if (href) {
      return href.startsWith("http") ? href : `${baseUrl.replace(/\/$/, "")}${path}`;
    }
  }
  const contactLink = $("a").filter(function () {
    const text = $(this).text().toLowerCase();
    return /contact|get in touch|reach us|contact us/.test(text);
  }).first().attr("href");
  if (contactLink) {
    return contactLink.startsWith("http") ? contactLink : `${baseUrl.replace(/\/$/, "")}/${contactLink.replace(/^\//, "")}`;
  }
  return null;
}

function findPricingPage($: cheerio.CheerioAPI, baseUrl: string): string | null {
  const paths = ["/pricing", "/pricing/", "/precios", "/precios/", "/planes", "/planes/", "/pricing-plans"];
  for (const path of paths) {
    const href = $(`a[href="${path}"], a[href*="${path}"]`).first().attr("href");
    if (href) {
      return href.startsWith("http") ? href : `${baseUrl.replace(/\/$/, "")}${path}`;
    }
  }
  const pricingLink = $("a").filter(function () {
    const text = $(this).text().toLowerCase();
    return /pricing|plans|pricing plan|planes|precios|cost/i.test(text);
  }).first().attr("href");
  if (pricingLink) {
    return pricingLink.startsWith("http") ? pricingLink : `${baseUrl.replace(/\/$/, "")}/${pricingLink.replace(/^\//, "")}`;
  }
  return null;
}

function findBlogPage($: cheerio.CheerioAPI, baseUrl: string): string | null {
  const paths = ["/blog", "/blog/", "/news", "/news/", "/insights", "/insights/", "/resources", "/resources/"];
  for (const path of paths) {
    const href = $(`a[href="${path}"], a[href*="${path}"]`).first().attr("href");
    if (href) {
      return href.startsWith("http") ? href : `${baseUrl.replace(/\/$/, "")}${path}`;
    }
  }
  const blogLink = $("a").filter(function () {
    const text = $(this).text().toLowerCase();
    return /blog|news|insights|resources|articles|webinar/i.test(text);
  }).first().attr("href");
  if (blogLink) {
    return blogLink.startsWith("http") ? blogLink : `${baseUrl.replace(/\/$/, "")}/${blogLink.replace(/^\//, "")}`;
  }
  return null;
}

function findHiringPage($: cheerio.CheerioAPI, baseUrl: string): string | null {
  const paths = ["/careers", "/careers/", "/jobs", "/jobs/", "/join-us", "/join-us/", "/trabaja", "/trabaja/"];
  for (const path of paths) {
    const href = $(`a[href="${path}"], a[href*="${path}"]`).first().attr("href");
    if (href) {
      return href.startsWith("http") ? href : `${baseUrl.replace(/\/$/, "")}${path}`;
    }
  }
  const hiringLink = $("a").filter(function () {
    const text = $(this).text().toLowerCase();
    return /careers|jobs|join us|we're hiring|trabaja/i.test(text);
  }).first().attr("href");
  if (hiringLink) {
    return hiringLink.startsWith("http") ? hiringLink : `${baseUrl.replace(/\/$/, "")}/${hiringLink.replace(/^\//, "")}`;
  }
  return null;
}

function extractSocialDomain(href: string): string | null {
  try {
    const url = new URL(href);
    const hostname = url.hostname.replace("www.", "");
    const socialDomains = [
      "linkedin.com", "twitter.com", "x.com", "facebook.com", "instagram.com",
      "youtube.com", "tiktok.com", "pinterest.com", "github.com", "crunchbase.com"
    ];
    for (const domain of socialDomains) {
      if (hostname.includes(domain)) return domain;
    }
  } catch {
    // ignore invalid URLs
  }
  return null;
}

function extractTechHints($: cheerio.CheerioAPI, html: string): string[] {
  const hints: string[] = [];

  const scripts = $("script[src]");
  scripts.each((_, el) => {
    const src = $(el).attr("src") || "";
    const lower = src.toLowerCase();
    if (lower.includes("google-analytics") || lower.includes("gtag")) hints.push("google-analytics");
    if (lower.includes("hubspot")) hints.push("hubspot");
    if (lower.includes("intercom")) hints.includes("intercom");
    if (lower.includes("zendesk")) hints.push("zendesk");
    if (lower.includes("stripe")) hints.push("stripe");
    if (lower.includes("shopify")) hints.push("shopify");
    if (lower.includes("wordpress")) hints.push("wordpress");
    if (lower.includes("wix")) hints.push("wix");
    if (lower.includes("squarespace")) hints.push("squarespace");
    if (lower.includes("hubspot")) hints.push("hubspot");
    if (lower.includes("salesforce")) hints.push("salesforce");
    if (lower.includes("mailchimp")) hints.push("mailchimp");
    if (lower.includes("klaviyo")) hints.push("klaviyo");
  });

  const metas = $("meta");
  metas.each((_, el) => {
    const name = $(el).attr("name") || $(el).attr("property") || "";
    const content = $(el).attr("content") || "";
    if (name.includes("generator") && content.toLowerCase().includes("wordpress")) hints.push("wordpress");
    if (name.includes("generator") && content.toLowerCase().includes("shopify")) hints.push("shopify");
  });

  return [...new Set(hints)];
}

function extractEmails(html: string): string | null {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = html.match(emailRegex);
  if (!matches || matches.length === 0) return null;
  const companyEmails = matches.filter((e) => {
    const domain = e.split("@")[1];
    return !/gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|aol\.com|ICloud\.com/.test(domain);
  });
  return companyEmails[0] || null;
}

function extractPhones(html: string): string | null {
  const phoneRegex = /(?:tel:)?\+?[\d\s\-().]{7,}/g;
  const matches = html.match(phoneRegex);
  if (!matches || matches.length === 0) return null;
  const cleaned = matches.map((m) => m.replace(/[^+\d]/g, ""));
  const usPhoneRegex = /^\+?1?\d{10}$/;
  const nonUsPhones = cleaned.filter((p) => !usPhoneRegex.test(p) || p.startsWith("+"));
  return nonUsPhones[0] || cleaned[0] || null;
}
