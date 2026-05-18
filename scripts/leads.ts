import { readFile } from "fs/promises";
import type { ExportLead } from "../lib/export/exporters";
import { leadStatusLabel } from "../lib/leads/status";
import { numberArg, parseArgs, stringArg } from "./cli-utils";

type ScanOutput = {
  id: string;
  leads: ExportLead[];
};

async function readOutput(path: string) {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as ScanOutput;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = stringArg(args, "input") || "output/latest.json";
  const status = stringArg(args, "status");
  const limit = numberArg(args, "limit", 0);
  const output = await readOutput(input);
  const ranked = output.leads
    .filter((lead) => !status || lead.status === status)
    .sort((a, b) => b.score - a.score);
  const leads = limit > 0 ? ranked.slice(0, limit) : ranked;

  if (!leads.length) {
    console.log("No potential clients found.");
    return;
  }

  console.log(`Search output: ${output.id}`);
  console.log("");

  for (const lead of leads) {
    const location = [lead.city, lead.country].filter(Boolean).join(", ") || "Location unavailable";
    console.log(`${lead.company_name}`);
    console.log(`  ${location} | ${lead.industry || "Industry unavailable"} | Score ${lead.score} | ${leadStatusLabel(lead.status)}`);
    console.log(`  ${lead.reason_for_fit}`);
    console.log("");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
