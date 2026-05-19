import { existsSync, readFileSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { evaluateCandidate } from "../lib/evaluate/evaluate";
import { leadsToCsv, leadsToHtml, leadsToMarkdown, type ExportLead } from "../lib/export/exporters";
import { loadResearchCandidates, type CandidateCompany } from "../lib/search/candidates";
import { defaultDesiredPublicData, desiredPublicData, searchConfigSchema, type SearchConfig } from "../lib/search/schemas";
import { runScan, rawRecordsToCandidates } from "../lib/scan/scanner";
import { enrichCandidates } from "../lib/enrich/enrich";
import taxonomy from "../config/taxonomy.json";

function getRegionMapping(): Record<string, string[]> {
  try {
    const raw = readFileSync("config/region-mapping.json", "utf8");
    return JSON.parse(raw).regions as Record<string, string[]>;
  } catch {
    return {};
  }
}

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
    source_links: lead.sources ?? [],
    created_at: timestamp,
    updated_at: timestamp
  };
}

// A lead is only actionable if it has at least one public contact channel.
function isContactable(lead: { website?: string | null; contact_page?: string | null; public_email?: string | null; public_phone?: string | null }) {
  return Boolean(lead.website || lead.contact_page || lead.public_email || lead.public_phone);
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

  if (categoryIndex < 0) {
    const available = taxonomy.categories.map((c) => c.id).join(", ");
    console.error(`No taxonomy category matches industry "${config.industry}".`);
    console.error("");
    console.error("The scanner cannot enumerate this industry without a matching category.");
    console.error("Scanning a wrong category would return unrelated, useless results.");
    console.error("");
    console.error("AGENT INSTRUCTIONS — resolve this before re-running the scan:");
    console.error(`  1. Check whether one of the existing categories fits the industry,`);
    console.error(`     and if so, set "industry" in ${REQUEST_FILE} to a matching label.`);
    console.error(`     Available categories: ${available}`);
    console.error(`  2. If no existing category fits, add a new category to`);
    console.error(`     config/taxonomy.json with: id, business_category, labels[],`);
    console.error(`     osm_tags[], places_type, places_keyword. Use an existing`);
    console.error(`     category as a template and choose OSM tags from`);
    console.error(`     https://wiki.openstreetmap.org/wiki/Map_features.`);
    console.error(`  3. If the industry has no physical-directory presence (e.g. a`);
    console.error(`     purely online or B2B service), tell the user the Directory`);
    console.error(`     Scanner cannot enumerate it and fall back to "npm run score"`);
    console.error(`     with a hand-researched config/candidates.json instead.`);
    console.error("");
    console.error("Do NOT guess a category — wrong results are worse than no results.");
    process.exit(1);
  }

  const categoryId = taxonomy.categories[categoryIndex].id;
  console.log(`Taxonomy match: ${categoryId}`);
  console.log("");

  const countryIso = (taxonomy.iso_codes as Record<string, string>)[config.country.toLowerCase()];

  if (!countryIso) {
    const available = Object.keys(taxonomy.iso_codes as Record<string, string>).join(", ");
    console.error(`No ISO code mapping for country "${config.country}".`);
    console.error("");
    console.error("AGENT INSTRUCTIONS — resolve this before re-running the scan:");
    console.error(`  1. Set "country" in ${REQUEST_FILE} to a recognized country name.`);
    console.error(`     Recognized countries: ${available}`);
    console.error(`  2. If the country is genuinely missing, add it to the "iso_codes"`);
    console.error(`     map in config/taxonomy.json (lowercase name -> ISO 3166-1 alpha-2).`);
    console.error("");
    console.error("Do NOT guess a country — the scan would target the wrong region.");
    process.exit(1);
  }

  console.log(`Running scanner (country ISO: ${countryIso})...`);

  // Enable region batching for large countries when no city/region specified
  const regionMapping = getRegionMapping();
  const shouldBatchByRegion = !config.region && !config.city && !!regionMapping[countryIso];

  const scanResult = await runScan({
    industry: config.industry,
    country: config.country,
    countryIso,
    region: config.region || null,
    city: config.city || null,
    categoryId,
    cacheDir: "cache",
    maxPages: 10,
    delayMs: 1000,
    batchByRegion: shouldBatchByRegion
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

  // Score all candidates to rank them
  console.log("");
  console.log(`Scoring all ${candidates.length} candidates...`);

  const scoredCandidates = candidates.map((candidate) => ({
    candidate,
    score: evaluateCandidate(config, candidate).score
  }));

  scoredCandidates.sort((a, b) => b.score - a.score);

  // Reorder candidates by score and save
  const rankedCandidates = scoredCandidates.map((sc) => sc.candidate);
  await saveCandidates(rankedCandidates, config);
  console.log(`Saved ${rankedCandidates.length} candidates to ${CANDIDATES_FILE} (ranked by fit score)`);

  // Enrich every candidate (fetch their sites, extract email/phone/contact page).
  // Enrichment is part of the automated pipeline — no separate manual step.
  console.log("");
  console.log(`Enriching all ${rankedCandidates.length} candidates (fetch sites, extract contact data)...`);

  await enrichCandidates(CANDIDATES_FILE, { maxConcurrency: 3, delayMs: 500 });

  // Re-score after enrichment since contact data affects scores
  console.log("");
  console.log("Re-scoring after enrichment...");

  // enrichedResults only contains enriched candidates; load full file for final ranking
  const enrichedFile = JSON.parse(await readFile(CANDIDATES_FILE, "utf8")) as { candidates: CandidateCompany[] };
  const finalCandidates = enrichedFile.candidates;

  const evaluated = finalCandidates
    .map((candidate) => evaluateCandidate(config, candidate))
    .sort((a, b) => b.score - a.score);
  const leads = evaluated
    .filter((lead) => lead.score >= config.minimum_score)
    .filter(isContactable)
    .map((lead, index) => toExportLead(lead, index, timestamp));

  const output: ScanOutput = {
    id,
    generated_at: timestamp,
    config,
    leads,
    coverage: scanResult.coverage,
    total_raw: scanResult.records.length,
    total_deduped: finalCandidates.length
  };

  await writeOutputs(output);

  const withContact = leads.filter((l) => l.public_email || l.public_phone).length;
  console.log("");
  console.log(`Scan complete: ${config.name}`);
  console.log(`Potential clients found: ${leads.length} of ${evaluated.length} scored (minimum score ${config.minimum_score}, with public contact data)`);
  console.log(`With contact data (email/phone): ${withContact}`);
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
