# search4clients — Agent Instructions

## Mission

Turn any AI coding CLI into a client-prospecting command center. Enumerate real companies from structured public directories, score their fit, and export a reviewable lead list. The agent configures the request, drives the scanner, and enriches results. The user always acts — the agent recommends and prepares.

## How it works

```text
search.request.json  →  npm run scan  →  candidates.json  →  score  →  export  →  output/
                              ↑
                    Directory Scanner
                    (Overpass / Places / browser directories)
```

The Directory Scanner (`lib/scan/`) enumerates real companies from structured public sources:

| Source            | Kind      | Key required              | Coverage                           |
| ----------------- | --------- | ------------------------- | ---------------------------------- |
| OSM Overpass      | API       | No — free                 | Physical businesses worldwide      |
| Google Places API | API       | `GOOGLE_PLACES_API_KEY`   | Physical and service businesses    |
| Browser directory | Playwright | No (ToS-verified per source) | Country-specific directories    |

Sources are configured in `config/sources.json`. Categories are mapped in `config/taxonomy.json`.

## CLI support

| CLI         | Instruction file          | Commands          |
| ----------- | ------------------------- | ----------------- |
| Claude Code | `CLAUDE.md` → this file   | `/search4clients` |
| Gemini CLI  | `GEMINI.md` → this file   | `/search4clients` |
| OpenCode    | `AGENTS.md` (this file)   | `/search4clients` |
| Codex       | `AGENTS.md` (this file)   | `/search4clients` |

## Primary flow

1. Read `config/search.request.json`. If missing, tell the user to run `npm run setup`.
2. Ask only for missing required fields: `service_offered`, `industry`, `country`. `city` is optional.
3. Update `config/search.request.json`.
4. Run `npm run doctor` to verify setup.
5. Run `npm run scan` — the scanner enumerates, scores, and exports automatically.
6. Run `npm run leads` to print the ranked list.
7. Point the user to `output/latest.html` or the timestamped files in `output/`.

## Slash command modes

Load the relevant mode file before executing each command:

| Command                    | Mode file          | What it does                               |
| -------------------------- | ------------------ | ------------------------------------------ |
| `/search4clients`          | —                  | Show all commands, then run primary flow   |
| `/search4clients scan`     | `modes/scan.md`    | Enumerate companies via Directory Scanner  |
| `/search4clients enrich`   | `modes/enrich.md`  | Fetch company sites, detect signals        |
| `/search4clients score`    | `modes/score.md`   | Score and rank pre-existing candidates     |
| `/search4clients export`   | `modes/export.md`  | Export to HTML/CSV/MD                      |
| `/search4clients batch`    | `modes/batch.md`   | Parallel multi-region or multi-category scan |

## Scanning policy

### Allowed

- Navigate and paginate public directories whose `robots.txt` and Terms of Service permit automated access.
- Query the OSM Overpass API (public, free, rate-limited at ~1 req/s).
- Query the Google Places API using a valid API key.
- Fetch individual company websites to collect public contact data and signals.

### Forbidden — never bypass, never work around

- CAPTCHAs, paywalls, authentication walls, login requirements.
- `robots.txt` Disallow directives.
- Server-set rate limits — always add polite delays between requests.
- Proxy rotation, IP spoofing, or user-agent spoofing to evade detection.
- Scraping Google Maps, Google Search results, or any Google property other than through the official Places API.
- Storing or exporting personal data (individual names, personal emails, personal phones). Company-level public data only.

## Rules

- **Never invent** companies, contacts, emails, phones, addresses, or source URLs. Every candidate must be a real company found by the scanner or the agent's own fetch tools.
- **Never send outreach** automatically. This tool prepares lists; the user decides and acts.
- **Real data only.** Unknown fields stay `null` or empty.
- **OSM attribution required.** Every export that includes OSM-sourced data must carry "© OpenStreetMap contributors" (ODbL license).
- If `config/sources.json` has no enabled source for the requested country or category, say so clearly and ask whether to proceed with Overpass/Places only or to add a new source entry.
- Do not add or enable a browser directory source without confirming the site's `robots.txt` and ToS permit automated pagination.

## Output

After `npm run scan`:

```text
output/search-<timestamp>.html    full lead list with scoring
output/search-<timestamp>.csv
output/search-<timestamp>.md
output/search-<timestamp>.json
output/latest.*                   always points to the most recent scan
```

Each export includes a coverage line: "N companies found across M sources."

## Development commands

```bash
npm run setup        # create config/search.request.json from template
npm run doctor       # verify setup (Node, Playwright, .env, config files)
npm run scan         # enumerate → score → export (full automated pipeline)
npm run score        # score pre-existing config/candidates.json → export
npm run leads        # print ranked list from latest output
npm run export -- --format html --out output/leads.html
npm run typecheck    # type-check only (no emit)
```
