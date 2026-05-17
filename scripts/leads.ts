import { leadStatusLabel } from "../lib/leads/status";
import { disconnectPrisma, numberArg, parseArgs, stringArg } from "./cli-utils";

async function main() {
  const { prisma } = await import("../lib/storage/prisma");
  const args = parseArgs(process.argv.slice(2));
  const searchId = numberArg(args, "search-id", NaN);
  const status = stringArg(args, "status");
  const limit = numberArg(args, "limit", 20);

  const leads = await prisma.lead.findMany({
    where: {
      search_id: Number.isFinite(searchId) ? searchId : undefined,
      status: status || undefined
    },
    orderBy: [{ score: "desc" }, { created_at: "desc" }],
    take: limit
  });

  if (!leads.length) {
    console.log("No potential clients found.");
    await prisma.$disconnect();
    return;
  }

  for (const lead of leads) {
    const location = [lead.city, lead.country].filter(Boolean).join(", ") || "Location unavailable";
    console.log(`#${lead.id} ${lead.company_name}`);
    console.log(`  ${location} | ${lead.industry || "Industry unavailable"} | Score ${lead.score} | ${leadStatusLabel(lead.status)}`);
    console.log(`  ${lead.reason_for_fit}`);
    console.log("");
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await disconnectPrisma();
  process.exit(1);
});
