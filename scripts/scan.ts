import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { evaluateCandidate } from "../lib/evaluate/evaluate";
import { leadsToCsv, leadsToHtml, leadsToMarkdown, type ExportLead } from "../lib/export/exporters";
import { loadResearchCandidates, type CandidateCompany } from "../lib/search/candidates";
import { defaultDesiredPublicData, desiredPublicData, searchConfigSchema, type SearchConfig } from "../lib/search/schemas";
import { runScan, rawRecordsToCandidates } from "../lib/scan/scanner";
import taxonomy from "../config/taxonomy.json";

const REQUEST_FILE = "config/search.request.json";
const CANDIDATES_FILE = "config/candidates.json";

type ScanOutput = {
  id: string;
  generated_at: string;
  config: SearchConfig;
  leads: ExportLead[];
  coverage: Array<{ source_id: string; count: number }>;
  total_raw: number;
  total_deduped: number;
};

async function readRequestFile(filePath: string) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

function buildConfig(fileConfig: Record<string, unknown>) {
  const fileData = Array.isArray(fileConfig.desired_public_data) ? fileConfig.desired_public_data.map(String) : [];
  const requestedData = Array.from(new Set([...defaultDesiredPublicData, ...fileData]))
    .filter((item): item is (typeof desiredPublicData)[number] => desiredPublicData.includes(item as (typeof desiredPublicData)[number]));

  return searchConfigSchema.parse({
    ...fileConfig,
    desired_public_data: requestedData
  });
}

function findCategoryIndex(industry: string): number {
  const lower = industry.toLowerCase();
  for (let i = 0; i < taxonomy.categories.length; i++) {
    const cat = taxonomy.categories[i];
    if (cat.id.toLowerCase() === lower) return i;
    if (cat.labels.some((l) => l.toLowerCase() === lower)) return i;
    if (cat.labels.some((l) => lower.includes(l.toLowerCase()))) return i;
  }
  return -1;
}

function toExportLead(lead: ReturnType<typeof evaluateCandidate>, index: number, timestamp: string): ExportLead {
  return {
    company_name: lead.company_name,
    country: lead.country,
    region: lead.region ?? null,
    city: lead.city ?? null,
    industry: lead.industry,
    business_category: lead.business_category,
    website: lead.website ?? null,
    contact_page: lead.contact_page ?? null,
    public_email: lead.public_email ?? null,
    public_phone: lead.public_phone ?? null,
    linkedin_company_page: lead.linkedin_company_page ?? null,
    score: lead.score,
    fit_grade: lead.fit_grade,
    contactability_score: lead.contactability_score,
    confidence_score: lead.confidence_score,
    status: "new",
    reason_for_fit: lead.reason_for_fit,
    suggested_offer: lead.suggested_offer,
    suggested_outreach_angle: lead.suggested_outreach_angle,
    notes: `Lead ${index + 1}`,
    created_at: timestamp,
    updated_at: timestamp
  };
}

async function writeOutputs(output: ScanOutput) {
  await mkdir("output", { recursive: true });
  const base = path.join("output", `search-${output.id}`);
  const json = JSON.stringify(output, null, 2);
  const html = leadsToHtml(output.leads);
  const csv = leadsToCsv(output.leads);
  const markdown = leadsToMarkdown(output.leads);

  await writeFile(`${base}.json`, json, "utf8");
  await writeFile(`${base}.html`, html, "utf8");
  await writeFile(`${base}.csv`, csv, "utf8");
  await writeFile(`${base}.md`, markdown, "utf8");
  await writeFile(path.join("output", "latest.json"), json, "utf8");
  await writeFile(path.join("output", "latest.html"), html, "utf8");
  await writeFile(path.join("output", "latest.csv"), csv, "utf8");
  await writeFile(path.join("output", "latest.md"), markdown, "utf8");
}

async function saveCandidates(candidates: CandidateCompany[], request: SearchConfig) {
  await mkdir("config", { recursive: true });
  const data = {
    generated_by: "scanner",
    generated_at: new Date().toISOString(),
    request_name: request.name,
    candidates
  };
  await writeFile(CANDIDATES_FILE, JSON.stringify(data, null, 2), "utf8");
}

async function main() {
  if (!existsSync(REQUEST_FILE)) {
    console.error(`No request file found at ${REQUEST_FILE}.`);
    console.error("");
    console.error("Run: npm run setup");
    process.exit(1);
  }

  const config = buildConfig(await readRequestFile(REQUEST_FILE));
  const timestamp = new Date().toISOString();
  const id = timestamp.replace(/[-:.TZ]/g, "").slice(0, 14);

  console.log(`Scan: ${config.name}`);
  console.log(`Industry: ${config.industry}`);
  console.log(`Country: ${config.country}`);
  console.log("");

  const categoryIndex = findCategoryIndex(config.industry);
  const categoryId = categoryIndex >= 0 ? taxonomy.categories[categoryIndex].id : "bookstore";

  if (categoryIndex < 0) {
    console.log(`Warning: "${config.industry}" not found in taxonomy. Using default category: ${categoryId}`);
  } else {
    console.log(`Taxonomy match: ${categoryId}`);
  }
  console.log("");

  const countryIso = (taxonomy.iso_codes as Record<string, string>)[config.country.toLowerCase()] || "US";
  console.log(`Running scanner (country ISO: ${countryIso})...`);

  const scanResult = await runScan({
    industry: config.industry,
    country: config.country,
    countryIso,
    region: config.region || null,
    city: config.city || null,
    categoryId,
    cacheDir: "cache",
    maxPages: 10,
    delayMs: 1000
  });

  console.log("");
  console.log(`Scanner complete: ${scanResult.records.length} records from ${scanResult.coverage.filter((c) => c.count > 0).length} sources`);

  for (const entry of scanResult.coverage) {
    console.log(`  ${entry.source_id}: ${entry.count}`);
  }

  const candidates = rawRecordsToCandidates(scanResult.records, {
    industry: config.industry,
    country: config.country,
    countryIso
  });

  await saveCandidates(candidates, config);
  console.log("");
  console.log(`Saved ${candidates.length} candidates to ${CANDIDATES_FILE}`);

  console.log("");
  console.log("Scoring candidates...");

  const leads = candidates
    .map((candidate) => evaluateCandidate(config, candidate))
    .sort((a, b) => b.score - a.score)
    .map((lead, index) => toExportLead(lead, index, timestamp));

  const output: ScanOutput = {
    id,
    generated_at: timestamp,
    config,
    leads,
    coverage: scanResult.coverage,
    total_raw: scanResult.records.length,
    total_deduped: candidates.length
  };

  await writeOutputs(output);

  console.log("");
  console.log(`Scan complete: ${config.name}`);
  console.log(`Potential clients found: ${leads.length} (full list, ranked by fit score)`);
  console.log("");
  console.log("Outputs:");
  console.log(`  output/search-${id}.html`);
  console.log(`  output/search-${id}.csv`);
  console.log(`  output/search-${id}.md`);
  console.log(`  output/search-${id}.json`);
  console.log("  output/latest.html");
  console.log("");
  console.log("Next:");
  console.log("  npm run leads");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
