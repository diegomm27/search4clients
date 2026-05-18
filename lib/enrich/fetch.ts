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
    if (lower.includes("intercom")) hints.push("intercom");
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
  // Prefer mailto: hrefs first, then fall back to regex extraction from body text
  const mailtoEmails: string[] = [];
  const $ = cheerio.load(html);
  $("a[href^='mailto:']").each((_: number, el: any) => {
    const href = $(el).attr("href") || "";
    const email = href.replace(/^mailto:/i, "").split("?")[0].split("#")[0];
    if (email && /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)) {
      mailtoEmails.push(email);
    }
  });

  // Filter out personal email providers
  const companyEmails = mailtoEmails.filter((e) => {
    const domain = e.split("@")[1].toLowerCase();
    return !/gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|aol\.com|icloud\.com|live\.com|protonmail\.com|yahoo\.es/.test(domain);
  });

  if (companyEmails.length > 0) return companyEmails[0];

  // Fallback: regex on the full HTML, but only look at body content
  const bodyText = $("body").text();
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = bodyText.match(emailRegex);
  if (!matches || matches.length === 0) return null;

  const filtered = matches.filter((e) => {
    const domain = e.split("@")[1].toLowerCase();
    return !/gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|aol\.com|icloud\.com|live\.com|protonmail\.com|yahoo\.es/.test(domain);
  });

  return filtered[0] || null;
}

function extractPhones(html: string): string | null {
  // Prefer tel: hrefs first, then fall back to regex on body text
  const telPhones: string[] = [];
  const $ = cheerio.load(html);
  $("a[href^='tel:']").each((_: number, el: any) => {
    const href = $(el).attr("href") || "";
    const phone = href.replace(/^tel:/i, "");
    if (phone) telPhones.push(phone);
  });

  // Also look for phone items in structured data (schema.org)
  const schemaPhones: string[] = [];
  const schemaMatch = html.match(/"telephone"\s*:\s*"([^"]+)"/);
  if (schemaMatch) {
    schemaPhones.push(schemaMatch[1]);
  }

  // Validate collected phones
  const validTel = telPhones.filter(validatePhone).slice(0, 5);
  const validSchema = schemaPhones.filter(validatePhone).slice(0, 5);

  if (validTel.length > 0) return validTel[0];
  if (validSchema.length > 0) return validSchema[0];

  // Fallback: regex on body text only (not the full HTML with scripts/styles)
  const bodyText = $("body").text();
  // Match phone patterns: international format, national format with country code prefix
  const phonePatterns = [
    /\+[\d\s\-().]{6,20}/g,         // international: +34..., +1..., etc.
    /\b\d{3}[\s\-]\d{3}[\s\-]\d{4}\b/g, // XXX-XXX-XXXX
    /\(\d{3}\)\s*\d{3}[\s\-]\d{4}/g,    // (XXX) XXX-XXXX
    /\b\d{3}[\s\-]\d{3}[\s\-]\d{4}\b/g, // XXX-XXX-XXXX
  ];

  for (const pattern of phonePatterns) {
    const matches = bodyText.match(pattern);
    if (matches) {
      const valid = matches.filter(validatePhone);
      if (valid.length > 0) return valid[0];
    }
  }

  return null;
}

/**
 * Validate that a string looks like a real phone number.
 * At least 7 digits, optionally with +, spaces, dashes, parens.
 * Rejects things that are clearly not phones (dates, IDs, prices).
 */
function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[^+\d]/g, "");

  // Must have at least 7 digits
  if (cleaned.length < 7 || cleaned.length > 16) return false;

  // Must start with + or a digit
  if (!/^\+?\d/.test(cleaned)) return false;

  // Reject if it looks like a date (YYYY-MM-DD, YYYY/MM/DD, etc.)
  if (/^\d{4}[-\/]\d{2}[-\/]\d{2}$/.test(phone.trim())) return false;

  // Reject if it's purely a short number (under 7 digits after cleaning)
  const digitCount = cleaned.replace(/\D/g, "").length;
  if (digitCount < 7) return false;

  // Reject if it looks like a price (contains currency symbols mixed in)
  if (/[€$£¥]\d/.test(phone.trim())) return false;

  return true;
}
