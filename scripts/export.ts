import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { leadsToCsv, leadsToHtml, leadsToMarkdown, type ExportLead } from "../lib/export/exporters";
import { parseArgs, stringArg } from "./cli-utils";

type ScanOutput = {
  leads: ExportLead[];
};

async function readOutput(filePath: string) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as ScanOutput;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = stringArg(args, "input") || "output/latest.json";
  const format = stringArg(args, "format") || "html";
  const out = stringArg(args, "out");
  const output = await readOutput(input);

  const content = format === "json"
    ? JSON.stringify(output, null, 2)
    : format === "markdown"
      ? leadsToMarkdown(output.leads)
      : format === "csv"
        ? leadsToCsv(output.leads)
        : leadsToHtml(output.leads);

  if (out) {
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, content, "utf8");
    console.log(`Exported ${output.leads.length} leads to ${out}`);
  } else {
    console.log(content);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
