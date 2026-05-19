import { existsSync } from "fs";
import { readFile, writeFile, mkdir } from "fs/promises";
import { loadWebSearchFindings, findingsToCandidates } from "../lib/scan/websearch";
import { candidatesFileSchema, type CandidateCompany } from "../lib/search/candidates";

/** Minimal request fields this script needs — read tolerantly so an unrelated
 * `desired_public_data` value in the request file cannot break the merge. */
function readRequest(raw: string): { name: string; industry: string; country: string } {
  const data = JSON.parse(raw) as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name : "";
  const industry = typeof data.industry === "string" ? data.industry : "";
  const country = typeof data.country === "string" ? data.country : "";
  if (!industry || !country) {
    throw new Error(`${REQUEST_FILE} is missing required fields "industry" and/or "country".`);
  }
  return { name, industry, country };
}

/**
 * websearch-merge — ingest an agent-produced web-search findings file and merge
 * it into config/candidates.json.
 *
 * The `npm run scan` pipeline has no LLM access, so open-web search is done by
 * the agent, which writes config/websearch-findings.json. This script validates
 * that file, converts findings to candidates, deduplicates against any existing
 * candidates, and writes the merged set back. The user then runs `npm run score`.
 *
 * Usage:
 *   npm run websearch                    # merge default findings file
 *   npm run websearch -- --findings path # merge a specific file
 */

const REQUEST_FILE = "config/search.request.json";
const FINDINGS_FILE = "config/websearch-findings.json";
const CANDIDATES_FILE = "config/candidates.json";

function parseArgs(argv: string[]): { findingsPath: string } {
  const idx = argv.indexOf("--findings");
  if (idx >= 0 && argv[idx + 1]) {
    return { findingsPath: argv[idx + 1] };
  }
  return { findingsPath: FINDINGS_FILE };
}

/** Stable dedup key — name + phone + website, lowercased and stripped. */
function dedupKey(c: CandidateCompany): string {
  return [
    c.company_name.toLowerCase().trim(),
    (c.public_phone || "").replace(/\D/g, ""),
    (c.website || "").toLowerCase().trim().replace(/\/+$/, "")
  ].join("|");
}

/** Merge incoming candidates into existing, preferring existing on conflict. */
function mergeCandidates(existing: CandidateCompany[], incoming: CandidateCompany[]): {
  merged: CandidateCompany[];
  added: number;
  duplicates: number;
} {
  const byKey = new Map<string, CandidateCompany>();
  for (const c of existing) {
    byKey.set(dedupKey(c), c);
  }

  let added = 0;
  let duplicates = 0;

  for (const c of incoming) {
    const key = dedupKey(c);
    const prior = byKey.get(key);
    if (!prior) {
      byKey.set(key, c);
      added++;
    } else {
      // Same business already known — union sources and signals, keep prior fields.
      prior.sources = [...new Set([...prior.sources, ...c.sources])];
      prior.observed_signals = [...new Set([...prior.observed_signals, ...c.observed_signals])];
      duplicates++;
    }
  }

  return { merged: [...byKey.values()], added, duplicates };
}

async function main() {
  const { findingsPath } = parseArgs(process.argv.slice(2));

  if (!existsSync(REQUEST_FILE)) {
    console.error(`No request file found at ${REQUEST_FILE}.`);
    console.error("Run: npm run setup");
    process.exit(1);
  }

  if (!existsSync(findingsPath)) {
    console.error(`No web-search findings file found at ${findingsPath}.`);
    console.error("");
    console.error("This command merges findings the agent produced via open-web search.");
    console.error("AGENT INSTRUCTIONS — produce the findings file first:");
    console.error("  1. Load modes/websearch.md and follow it.");
    console.error("  2. Search province-by-province (in the country's primary language");
    console.error(`     where it yields better results), extract real businesses, and`);
    console.error(`     write them to ${findingsPath} in the documented schema.`);
    console.error("  3. Re-run this command to merge them.");
    process.exit(1);
  }

  const config = readRequest(await readFile(REQUEST_FILE, "utf8"));

  let findingsFile;
  try {
    findingsFile = await loadWebSearchFindings(findingsPath);
  } catch (err) {
    console.error(`${findingsPath} failed schema validation.`);
    console.error("Every finding needs a non-empty company_name and at least one source URL.");
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const incoming = findingsToCandidates(findingsFile, {
    industry: config.industry,
    country: config.country
  });

  console.log(`Web-search findings: ${findingsFile.findings.length}`);
  console.log(`Regions searched: ${findingsFile.regions_searched.length || "unspecified"}`);
  if (findingsFile.search_language) {
    console.log(`Search language: ${findingsFile.search_language}`);
  }
  console.log("");

  // Load existing candidates if present, otherwise start fresh.
  let existing: CandidateCompany[] = [];
  if (existsSync(CANDIDATES_FILE)) {
    try {
      const parsed = candidatesFileSchema.parse(JSON.parse(await readFile(CANDIDATES_FILE, "utf8")));
      existing = parsed.candidates;
      console.log(`Existing candidates: ${existing.length}`);
    } catch {
      console.log(`Existing ${CANDIDATES_FILE} is invalid — starting fresh.`);
    }
  }

  const { merged, added, duplicates } = mergeCandidates(existing, incoming);

  await mkdir("config", { recursive: true });
  await writeFile(
    CANDIDATES_FILE,
    JSON.stringify(
      {
        generated_by: "websearch-merge",
        generated_at: new Date().toISOString(),
        request_name: config.name,
        candidates: merged
      },
      null,
      2
    ),
    "utf8"
  );

  console.log("");
  console.log(`Merged into ${CANDIDATES_FILE}:`);
  console.log(`  new candidates added:        ${added}`);
  console.log(`  duplicates merged (deduped): ${duplicates}`);
  console.log(`  total candidates:            ${merged.length}`);
  console.log("");
  console.log("Web-search candidates are tagged 'needs-verification' — review before outreach.");
  console.log("");
  console.log("Next:");
  console.log("  npm run score");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
