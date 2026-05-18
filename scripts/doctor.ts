import { existsSync } from "fs";

async function main() {
  const hasCandidates = existsSync("config/candidates.json");
  const checks = [
    { ok: Number(process.versions.node.split(".")[0]) >= 18, message: `Node.js ${process.versions.node}` },
    { ok: existsSync("config/search.request.example.json"), message: "Search request template exists" },
    { ok: existsSync("config/search.request.json"), message: existsSync("config/search.request.json") ? "Local search request exists" : "Local search request missing. Run: npm run setup" },
    {
      ok: true,
      message: hasCandidates
        ? "Candidate file ready: config/candidates.json (agent research found)"
        : "No config/candidates.json yet. The agent writes it during research."
    }
  ];

  let failed = false;
  for (const check of checks) {
    console.log(`${check.ok ? "OK" : "FIX"}  ${check.message}`);
    failed ||= !check.ok;
  }

  if (failed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
