import { existsSync } from "fs";
import { readFile } from "fs/promises";

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

  const hasEnv = existsSync(".env");
  const hasEnvExample = existsSync(".env.example");
  const placesKey = process.env.GOOGLE_PLACES_API_KEY;

  if (hasEnvExample && !hasEnv) {
    checks.push({ ok: false, message: ".env.example exists but .env is missing. Copy .env.example to .env" });
  } else if (hasEnv) {
    checks.push({ ok: true, message: ".env file exists" });
  } else {
    checks.push({ ok: true, message: "No .env.example found (no API keys required)" });
  }

  if (placesKey) {
    checks.push({ ok: true, message: "GOOGLE_PLACES_API_KEY is set in .env" });
  } else {
    checks.push({ ok: false, message: "GOOGLE_PLACES_API_KEY not set (Google Places will be skipped — Overpass still works)" });
  }

  if (existsSync("config/sources.json")) {
    try {
      const sources = JSON.parse(await readFile("config/sources.json", "utf8"));
      const enabled = sources.sources?.filter((s: { enabled: boolean }) => s.enabled).length || 0;
      checks.push({ ok: enabled > 0, message: `sources.json: ${enabled} enabled source(s)` });
    } catch {
      checks.push({ ok: false, message: "sources.json is invalid JSON" });
    }
  } else {
    checks.push({ ok: false, message: "config/sources.json not found" });
  }

  if (existsSync("config/taxonomy.json")) {
    try {
      const taxonomy = JSON.parse(await readFile("config/taxonomy.json", "utf8"));
      const cats = taxonomy.categories?.length || 0;
      const countries = Object.keys(taxonomy.iso_codes || {}).length;
      checks.push({ ok: cats > 0, message: `taxonomy.json: ${cats} categories, ${countries} countries` });
    } catch {
      checks.push({ ok: false, message: "taxonomy.json is invalid JSON" });
    }
  } else {
    checks.push({ ok: false, message: "config/taxonomy.json not found" });
  }

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
