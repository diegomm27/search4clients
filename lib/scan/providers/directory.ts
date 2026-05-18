import { chromium, type Browser, type Page } from "playwright";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { type RawRecord, type ProviderRequest, type ScanOptions, type ScanProvider } from "@/lib/scan/types";
import { loadSources, filterSources, type PlaywrightConfig } from "@/lib/scan/sources";

export class DirectoryProvider implements ScanProvider {
  id = "directory";
  kind = "browser" as const;

  private cacheDir: string;
  private delayMs: number;

  constructor(opts: { cacheDir: string; delayMs: number }) {
    this.cacheDir = opts.cacheDir;
    this.delayMs = opts.delayMs;
  }

  async scan(request: ProviderRequest, opts: ScanOptions): Promise<RawRecord[]> {
    const sources = await loadSources("config/sources.json");
    const matched = filterSources(sources, request.countryIso, "", process.env);

    const browserConfigs = matched
      .filter((s) => s.kind === "browser" && Boolean(s.playwright))
      .map((s) => ({ config: s.playwright!, sourceId: s.id }));

    if (browserConfigs.length === 0) {
      console.log("No browser directory sources enabled. Skipping directory scan.");
      return [];
    }

    const allRecords: RawRecord[] = [];

    for (const { config, sourceId } of browserConfigs) {
      const records = await this.scrapeDirectory(config, request, opts);
      allRecords.push(...records.map((r) => ({ ...r, source_id: sourceId })));
    }

    return allRecords;
  }

  private async scrapeDirectory(
    config: PlaywrightConfig,
    request: ProviderRequest,
    opts: ScanOptions
  ): Promise<RawRecord[]> {
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      const keyword = request.placesKeyword || request.industry;
      const entries = this.buildEntryUrls(config, keyword, request);

      const records: RawRecord[] = [];

      for (const entryUrl of entries) {
        const pageRecords = await this.paginate(page, config, entryUrl, opts);
        records.push(...pageRecords);

        if (pageRecords.length === 0) break;
      }

      await page.close();
      return records;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private buildEntryUrls(config: PlaywrightConfig, keyword: string, request: ProviderRequest): string[] {
    const location = request.city || request.region || "";
    const locationParam = location ? `/${encodeURIComponent(location)}` : "";

    return [
      config.entryUrl
        .replace("{KEYWORD}", encodeURIComponent(keyword))
        .replace("{LOCATION}", locationParam)
    ];
  }

  private async paginate(
    page: Page,
    config: PlaywrightConfig,
    entryUrl: string,
    opts: ScanOptions
  ): Promise<RawRecord[]> {
    let pageRecords: RawRecord[] = [];
    let currentPage = 0;
    const maxPages = config.maxPages || 50;

    while (currentPage < maxPages) {
      // Navigate to entryUrl on first page, then use goToNextPage for subsequent pages
      if (currentPage === 0) {
        await page.goto(entryUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      }
      await new Promise((r) => setTimeout(r, config.delayMs || 1500));

      const records = await this.extractRecords(page, config);
      pageRecords = pageRecords.concat(records);

      if (records.length === 0) break;

      if (this.shouldStop(config, page, currentPage, maxPages)) break;

      await this.goToNextPage(page, config);
      currentPage++;
    }

    return pageRecords;
  }

  private async extractRecords(page: Page, config: PlaywrightConfig): Promise<RawRecord[]> {
    const items = await page.locator(config.selectors.item).all();
    const records: RawRecord[] = [];

    for (const item of items) {
      try {
        const name = await item.locator(config.selectors.name).textContent().catch(() => null);
        const address = config.selectors.address
          ? await item.locator(config.selectors.address).textContent().catch(() => null)
          : null;
        const phone = config.selectors.phone
          ? await item.locator(config.selectors.phone).textContent().catch(() => null)
          : null;
        const websiteEl = config.selectors.website
          ? await item.locator(config.selectors.website).first().getAttribute("href").catch(() => null)
          : null;
        const email = config.selectors.email
          ? await item.locator(config.selectors.email).textContent().catch(() => null)
          : null;

        const website = websiteEl && websiteEl.startsWith("http") ? websiteEl : null;

        records.push({
          source_id: "directory",
          source_url: null,
          name: name?.trim() || "Unknown",
          address: address?.trim() || null,
          phone: phone?.trim() || null,
          website: website,
          email: email?.trim() || null,
          lat: null,
          lon: null,
          extra: {
            directory_source: config.entryUrl,
            raw_name: name || ""
          }
        });
      } catch {
        // Skip items that fail to parse
      }
    }

    return records;
  }

  private shouldStop(config: PlaywrightConfig, page: Page, currentPage: number, maxPages: number): boolean {
    if (config.stopCondition === "max-pages") return currentPage >= maxPages - 1;

    if (config.stopCondition === "empty-page") {
      // Stop if current page returned zero records (already checked before calling this)
      return false;
    }

    if (config.stopCondition === "no-next-button" && config.selectors.nextButton) {
      // Check if next button exists and is enabled
      return false;
    }

    return false;
  }

  private async goToNextPage(page: Page, config: PlaywrightConfig): Promise<void> {
    if (config.selectors.nextButton) {
      const nextBtn = page.locator(config.selectors.nextButton);
      // Check if next button exists and is visible/enabled
      const count = await nextBtn.count();
      if (count > 0) {
        const isVisible = await nextBtn.first().isVisible({ timeout: 2000 }).catch(() => false);
        const isEnabled = await nextBtn.first().isEnabled().catch(() => false);
        if (isVisible && isEnabled) {
          await nextBtn.first().click({ timeout: 5000 });
          await new Promise((r) => setTimeout(r, config.delayMs || 1500));
          return;
        }
      }
    }

    if (config.paginationType === "query-param" && config.paginationParam) {
      const currentUrl = page.url();
      const url = new URL(currentUrl);
      const currentParam = url.searchParams.get(config.paginationParam);
      const nextNum = currentParam ? (parseInt(currentParam, 10) + 1) : 2;
      url.searchParams.set(config.paginationParam, nextNum.toString());
      await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: 30000 });
      await new Promise((r) => setTimeout(r, config.delayMs || 1500));
    }
  }
}
