import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { leadsToCsv, leadsToHtml, leadsToMarkdown } from "../lib/export/exporters";
import { disconnectPrisma, numberArg, parseArgs, stringArg } from "./cli-utils";

async function main() {
  const { prisma } = await import("../lib/storage/prisma");
  const args = parseArgs(process.argv.slice(2));
  const searchId = numberArg(args, "search-id", NaN);
  const format = stringArg(args, "format") || "csv";
  const out = stringArg(args, "out");

  const leads = await prisma.lead.findMany({
    where: Number.isFinite(searchId) ? { search_id: searchId } : undefined,
    orderBy: [{ score: "desc" }, { created_at: "desc" }]
  });

  const content = format === "json"
    ? JSON.stringify(leads, null, 2)
    : format === "html"
      ? leadsToHtml(leads)
    : format === "markdown"
      ? leadsToMarkdown(leads)
      : leadsToCsv(leads);

  if (out) {
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, content, "utf8");
    console.log(`Exported ${leads.length} leads to ${out}`);
  } else {
    console.log(content);
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await disconnectPrisma();
  process.exit(1);
});
