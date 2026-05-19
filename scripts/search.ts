import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { evaluateCandidate } from "../lib/evaluate/evaluate";
import { leadsToCsv, leadsToHtml, leadsToMarkdown, type ExportLead } from "../lib/export/exporters";
import { loadResearchCandidates, type CandidateCompany } from "../lib/search/candidates";
import { defaultDesiredPublicData, desiredPublicData, searchConfigSchema, type SearchConfig } from "../lib/search/schemas";

const REQUEST_FILE = "config/search.request.json";
const CANDIDATES_FILE = "config/candidates.json";

type ScanOutput = {
  id: string;
  generated_at: string;
  config: SearchConfig;
  leads: ExportLead[];
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

  if (!existsSync(CANDIDATES_FILE)) {
    console.error(`No candidate file found at ${CANDIDATES_FILE}.`);
    console.error("");
    console.error("Your agent must research the web first and write that file.");
    console.error("Run /search4clients in Claude, Codex, OpenCode, or Gemini.");
    process.exit(1);
  }

  console.log(`Scoring researched candidates from ${CANDIDATES_FILE}.`);
  let candidates: CandidateCompany[];
  try {
    candidates = await loadResearchCandidates(CANDIDATES_FILE);
  } catch {
    console.error(`${CANDIDATES_FILE} is not a valid candidate file.`);
    console.error("");
    console.error("It must contain a non-empty \"candidates\" array of real");
    console.error("companies. See config/candidates.example.json for the shape.");
    process.exit(1);
  }

  const evaluated = candidates
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
    leads
  };

  await writeOutputs(output);

  console.log("");
  console.log(`Scan complete: ${config.name}`);
  console.log(`Potential clients found: ${leads.length} of ${evaluated.length} scored (minimum score ${config.minimum_score}, with public contact data)`);
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
