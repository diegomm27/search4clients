import { readFile } from "fs/promises";
import { defaultDesiredPublicData, desiredPublicData, searchConfigSchema } from "../lib/search/schemas";
import { disconnectPrisma, listArg, numberArg, parseArgs, printHelp, stringArg } from "./cli-utils";

function help() {
  printHelp("Run a local search4clients search", [
    "Required:",
    "  --service \"Website redesign\"",
    "  --industry \"Dental clinics\"",
    "  --country \"Spain\"",
    "",
    "Or use a request file:",
    "  --file config/search.request.json",
    "",
    "Optional:",
    "  --city \"Madrid\"",
    "  --results 25",
    "  --minimum-score 70",
    "  --data website,contact_page,public_email",
    "  --signals \"old website,no online booking\"",
    "  --exclude \"large chains,franchises\"",
    "",
    "Example:",
    "  npm run scan",
    "  npm run search -- --service \"Website redesign\" --industry \"Dental clinics\" --country \"Spain\" --city \"Madrid\""
  ]);
}

async function readRequestFile(path: string) {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

async function main() {
  const [{ runSearch }, { prisma }] = await Promise.all([
    import("../lib/search/orchestrator"),
    import("../lib/storage/prisma")
  ]);
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    help();
    return;
  }

  const file = stringArg(args, "file");
  const fileConfig = file ? await readRequestFile(file) : {};

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

  const config = searchConfigSchema.parse({
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
    number_of_results: numberArg(args, "results", typeof fileConfig.number_of_results === "number" ? fileConfig.number_of_results : 25),
    minimum_score: numberArg(args, "minimum-score", typeof fileConfig.minimum_score === "number" ? fileConfig.minimum_score : 70),
    output_format: "dashboard"
  });

  console.log("Demo mode: generating results from sample public-business data.");
  const search = await runSearch(config);

  console.log("");
  console.log(`Saved search #${search.id}: ${search.name}`);
  console.log(`Potential clients saved: ${search.leads.length}`);
  console.log("");
  console.log("Next:");
  console.log(`  npm run leads -- --search-id ${search.id}`);
  console.log(`  npm run export -- --search-id ${search.id} --format html --out output/search-${search.id}.html`);
  console.log(`  npm run dev  # review visually at http://localhost:3000/searches/results?id=${search.id}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await disconnectPrisma();
  process.exit(1);
});
