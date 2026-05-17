import { existsSync } from "fs";
import { disconnectPrisma } from "./cli-utils";

async function checkDatabase(prisma: Awaited<typeof import("../lib/storage/prisma")>["prisma"]) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.search.count();
    return { ok: true, message: "SQLite database is ready" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error && error.message.includes("does not exist")
        ? "Database tables are missing. Run: npm run setup"
        : "Database is not ready. Run: npm run setup"
    };
  }
}

async function main() {
  const { prisma } = await import("../lib/storage/prisma");
  const checks = [
    { ok: Number(process.versions.node.split(".")[0]) >= 18, message: `Node.js ${process.versions.node}` },
    { ok: existsSync("config/search.request.example.json"), message: "Search request template exists" },
    { ok: existsSync("config/search.request.json"), message: existsSync("config/search.request.json") ? "Local search request exists" : "Local search request missing. Run: npm run setup" },
    { ok: true, message: "Search provider: demo" },
    await checkDatabase(prisma)
  ];

  let failed = false;
  for (const check of checks) {
    console.log(`${check.ok ? "OK" : "FIX"}  ${check.message}`);
    failed ||= !check.ok;
  }

  await prisma.$disconnect();
  if (failed) process.exit(1);
}

main().catch(async (error) => {
  console.error(error);
  await disconnectPrisma();
  process.exit(1);
});
