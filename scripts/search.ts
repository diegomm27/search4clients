import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { evaluateCandidate } from "../lib/evaluate/evaluate";
import { leadsToCsv, leadsToHtml, leadsToMarkdown, type ExportLead } from "../lib/export/exporters";
import { loadResearchCandidates, type CandidateCompany } from "../lib/search/candidates";
import { defaultDesiredPublicData, desiredPublicData, searchConfigSchema, type SearchConfig } from "../lib/search/schemas";
import { listArg, numberArg, parseArgs, printHelp, stringArg } from "./cli-utils";

const CANDIDATES_FILE = "config/candidates.json";

type ScanOutput = {
  id: string;
  generated_at: string;
  config: SearchConfig;
  leads: ExportLead[];
};

function help() {
  printHelp("Score and export a search4clients candidate list", [
    "Default request-file workflow:",
    "  npm run scan",
    "",
    "The scan reads:",
    "  config/search.request.json   the search criteria",
    "  config/candidates.json       companies found by agent web research",
    "",
    "Your agent (claude / codex / opencode) fills config/candidates.json by",
    "researching the web according to config/search.request.json. The scan then",
    "scores, ranks, and exports that list.",
    "",
    "Flags:",
    "  --file config/search.request.json   request file path",
    "  --candidates config/candidates.json candidate file path",
    "  --max-results N                     optionally cap the list",
    "",
    "Every researched company is returned, ranked by fit score.",
    "",
    "Outputs:",
    "  output/search-<id>.json",
    "  output/search-<id>.html",
    "  output/search-<id>.csv",
    "  output/search-<id>.md",
    "  output/latest.json"
  ]);
}

async function readRequestFile(filePath: string) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

function buildConfig(args: Record<string, string | boolean | string[]>, fileConfig: Record<string, unknown>) {
  const service = stringArg(args, "service") || String(fileConfig.service_offered || "");
  const industry = stringArg(args, "industry") || String(fileConfig.industry || "");
  const country = stringArg(args, "country") || String(fileConfig.country || "");
  const city = stringArg(args, "city") || (typeof fileConfig.city === "string" ? fileConfig.city : null);

  if (!service || !industry || !country) {
    help();
    process.exit(1);
  }

  const fileData = Array.isArray(fileConfig.desired_public_data) ? fileConfig.desired_public_data.map(String) : [];
  const fileSignals = Array.isArray(fileConfig.ideal_client_signals) ? fileConfig.ideal_client_signals.map(String) : [];
  const fileExclude = Array.isArray(fileConfig.exclude_signals) ? fileConfig.exclude_signals.map(String) : [];
  const cliSignals = listArg(args, "signals");
  const cliExclude = listArg(args, "exclude");
  const requestedData = Array.from(new Set([...defaultDesiredPublicData, ...fileData, ...listArg(args, "data")]))
    .filter((item): item is (typeof desiredPublicData)[number] => desiredPublicData.includes(item as (typeof desiredPublicData)[number]));

  return searchConfigSchema.parse({
    ...fileConfig,
    name: stringArg(args, "name") || String(fileConfig.name || "") || [city, country, industry].filter(Boolean).join(" ") + ` for ${service}`,
    country,
    city,
    region: stringArg(args, "region") || (typeof fileConfig.region === "string" ? fileConfig.region : null),
    language: stringArg(args, "language") || (typeof fileConfig.language === "string" ? fileConfig.language : null),
    industry,
    service_offered: service,
    target_client_type: stringArg(args, "target-client-type") || (typeof fileConfig.target_client_type === "string" ? fileConfig.target_client_type : null),
    ideal_client_signals: cliSignals.length ? cliSignals : fileSignals,
    exclude_signals: cliExclude.length ? cliExclude : fileExclude,
    desired_public_data: requestedData,
    max_results: numberArg(args, "max-results", typeof fileConfig.max_results === "number" ? fileConfig.max_results : 0) || null,
    output_format: "dashboard"
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

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    help();
    return;
  }

  const file = stringArg(args, "file");
  const fileConfig = file ? await readRequestFile(file) : {};
  const config = buildConfig(args, fileConfig);
  const timestamp = new Date().toISOString();
  const id = timestamp.replace(/[-:.TZ]/g, "").slice(0, 14);

  const candidatesFile = stringArg(args, "candidates") || CANDIDATES_FILE;

  if (!existsSync(candidatesFile)) {
    console.error(`No candidate file found at ${candidatesFile}.`);
    console.error("");
    console.error("Your agent must research the web first and write that file.");
    console.error("Run the /search4clients command in claude, codex, or opencode.");
    process.exit(1);
  }

  console.log(`Scoring researched candidates from ${candidatesFile}.`);
  let candidates: CandidateCompany[];
  try {
    candidates = await loadResearchCandidates(candidatesFile);
  } catch {
    console.error(`${candidatesFile} is not a valid candidate file.`);
    console.error("");
    console.error("It must contain a non-empty \"candidates\" array of real");
    console.error("companies. See config/candidates.example.json for the shape.");
    process.exit(1);
  }

  const leads = candidates
    .map((candidate) => evaluateCandidate(config, candidate))
    .sort((a, b) => b.score - a.score)
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
