import * as cheerio from "cheerio";

export type SiteData = {
  canonicalUrl: string | null;
  title: string | null;
  description: string | null;
  contactPage: string | null;
  publicEmail: string | null;
  /** Every public email found on the home page and the contact/legal pages, best first. */
  publicEmails: string[];
  publicPhone: string | null;
  /** Lowercased visible text of the pages read (capped), for keyword signals. */
  textSample: string;
  /** Pages actually read for this site (home + contact/legal subpages). */
  pagesRead: string[];
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

  const siteHost = hostOf(canonicalUrl) || hostOf(normalizedUrl);
  const pagesRead = [normalizedUrl];
  let textSample = $("body").text().replace(/\s+/g, " ").toLowerCase();
  let emails = extractAllEmails(html);
  const publicPhone = extractPhones(html);

  // Small Spanish businesses rarely put the email on the home page, but the
  // contact page and the legally required "aviso legal" (LSSI) usually carry it.
  if (emails.length === 0) {
    const subpages = findEmailSubpages($, normalizedUrl, contactPage).slice(0, 3);
    for (const subUrl of subpages) {
      await new Promise((resolve) => setTimeout(resolve, Math.max(delayMs, 500)));
      const subHtml = await fetchHtml(subUrl);
      if (!subHtml) continue;
      pagesRead.push(subUrl);
      emails = [...emails, ...extractAllEmails(subHtml)];
      textSample += " " + cheerio.load(subHtml)("body").text().replace(/\s+/g, " ").toLowerCase();
      if (emails.length > 0) break;
    }
  }
  const publicEmails = rankEmails([...new Set(emails.map((e) => e.toLowerCase()))], siteHost);
  const publicEmail = publicEmails[0] || null;

  return {
    canonicalUrl,
    title,
    description,
    contactPage,
    publicEmail,
    publicEmails,
    publicPhone,
    textSample: textSample.slice(0, 20000),
    pagesRead,
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

  const lowerHtml = html.toLowerCase();
  if (/wp-content|wp-includes/.test(lowerHtml)) hints.push("wordpress");

  const metas = $("meta");
  metas.each((_, el) => {
    const name = $(el).attr("name") || $(el).attr("property") || "";
    const content = $(el).attr("content") || "";
    if (name.includes("generator") && content.toLowerCase().includes("wordpress")) hints.push("wordpress");
    if (name.includes("generator") && content.toLowerCase().includes("shopify")) hints.push("shopify");
  });

  return [...new Set(hints)];
}

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const FREE_EMAIL_DOMAINS = /(^|\.)(gmail|googlemail|yahoo|hotmail|outlook|aol|icloud|live|msn|protonmail|proton|gmx|yandex|zoho)\.[a-z.]+$/;
const BAD_EMAIL_PARTS = /(example\.|sentry|wixpress|\.png$|\.jpe?g$|\.gif$|\.webp$|\.svg$|@2x|noreply|no-reply|domain\.com|email\.com|tudominio|yourdomain)/i;

/** Every plausible public email in a page: mailto links, visible text and simple obfuscations. */
export function extractAllEmails(html: string): string[] {
  const $ = cheerio.load(html);
  const found: string[] = [];

  $("a[href^='mailto:'], a[href^='MAILTO:']").each((_: number, el: any) => {
    const href = $(el).attr("href") || "";
    const email = decodeURIComponent(href.replace(/^mailto:/i, "").split("?")[0].split("#")[0]).trim();
    if (email) found.push(email);
  });

  const text = $("body").text()
    // "info [at] business [dot] es", "info(arroba)business.es"
    .replace(/\s*[\[(]\s*(at|arroba)\s*[\])]\s*/gi, "@")
    .replace(/\s*[\[(]\s*(dot|punto)\s*[\])]\s*/gi, ".");
  found.push(...(text.match(EMAIL_RE) || []));

  // Cloudflare email protection: data-cfemail hex-encoded with a XOR key.
  $("[data-cfemail]").each((_: number, el: any) => {
    const decoded = decodeCfEmail($(el).attr("data-cfemail") || "");
    if (decoded) found.push(decoded);
  });

  return found
    .map((e) => e.replace(/^[.\-_]+|[.\-_]+$/g, ""))
    .filter((e) => /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(e))
    .filter((e) => !BAD_EMAIL_PARTS.test(e));
}

/**
 * Order emails best first: same domain as the site, then other company domains,
 * then free providers (many small businesses only publish a Gmail address on
 * their own site; it is still the business's published contact, so it is kept
 * but ranked last).
 */
export function rankEmails(emails: string[], siteHost: string | null): string[] {
  const base = siteHost ? siteHost.replace(/^www\./, "") : null;
  const rank = (e: string) => {
    const domain = e.split("@")[1].toLowerCase();
    if (base && (domain === base || domain.endsWith("." + base) || base.endsWith("." + domain))) return 0;
    if (FREE_EMAIL_DOMAINS.test(domain)) return 2;
    return 1;
  };
  return [...emails].sort((a, b) => rank(a) - rank(b));
}

export function isFreeProviderEmail(email: string): boolean {
  return FREE_EMAIL_DOMAINS.test(email.split("@")[1]?.toLowerCase() || "");
}

function decodeCfEmail(hex: string): string | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length < 4) return null;
  const key = parseInt(hex.slice(0, 2), 16);
  let out = "";
  for (let i = 2; i < hex.length; i += 2) {
    out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
  }
  return out.includes("@") ? out : null;
}

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Same-site pages likely to carry the email: contact, legal notice, privacy policy. */
function findEmailSubpages($: cheerio.CheerioAPI, pageUrl: string, contactPage: string | null): string[] {
  const host = hostOf(pageUrl);
  const urls: string[] = [];
  const push = (href: string | undefined) => {
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) return;
    try {
      const abs = new URL(href, pageUrl);
      if (host && abs.hostname.toLowerCase() !== host) return;
      abs.hash = "";
      const s = abs.toString();
      if (!urls.includes(s) && s !== pageUrl) urls.push(s);
    } catch {
      // ignore invalid hrefs
    }
  };
  if (contactPage) push(contactPage);
  $("a[href]").each((_: number, el: any) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().toLowerCase();
    if (/contact|aviso[- ]legal|legal|privacidad|privacy|cookies/.test(text + " " + href.toLowerCase())) push(href);
  });
  // Contact first, then legal notice, then the rest.
  const score = (u: string) => (/contact/.test(u) ? 0 : /aviso|legal/.test(u) ? 1 : 2);
  return urls.sort((a, b) => score(a) - score(b));
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return null;
    const ct = resp.headers.get("content-type") || "";
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) return null;
    return await resp.text();
  } catch {
    return null;
  }
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
