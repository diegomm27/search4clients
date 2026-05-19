# /search4clients

Find real potential B2B clients by enumerating companies from public directories, scoring their fit, and exporting a reviewable lead list.

## Modes

- `/search4clients` - show the workflow and required request file.
- `/search4clients scan` - enumerate companies via Directory Scanner, score, and export.
- `/search4clients websearch` - open-web search to supplement the scanner; see `modes/websearch.md`.
- `/search4clients enrich` - fetch company sites, extract contact data, detect signals.
- `/search4clients score` - score and rank pre-existing candidates.
- `/search4clients export` - export the latest scan to CSV/Markdown/JSON/HTML.
- `/search4clients batch` - parallel multi-region or multi-category scan.

## Workflow

1. Read `AGENTS.md`.
2. Check `config/search.request.json`. If missing, run `npm run setup` or copy `config/search.request.example.json`.
3. Ask only for missing required fields:
   - What service/product does the user sell?
   - What type of clients or industry do they want?
   - What country should be searched? (City optional.)
4. Update `config/search.request.json` with the user's criteria.
5. Run `npm run doctor` to verify setup (Node, Playwright, .env keys, config files).
6. Run `npm run scan` — the scanner enumerates companies from public directories
   (Overpass API, Google Places, browser directories), scores them, and exports.
7. Run `npm run leads` to show the ranked list.
8. Summarize the results and point the user to `output/latest.html`.

## Alternative flows

- **Enrich only**: If you already have `config/candidates.json`, run `npm run enrich`.
- **Score only**: If you have a hand-written `candidates.json`, run `npm run score`.
  **Never** use `npm run scan` for hand-written files — it overwrites `candidates.json`.
- **Web search supplement**: To fill gaps the structured scanner missed, load
  `modes/websearch.md`, search the open web province-by-province (in the country's
  primary language where it helps), write `config/websearch-findings.json`, then
  run `npm run websearch` to merge into `candidates.json` and `npm run score`.
  Web search **samples** — it is a supplement to `npm run scan`, not a replacement.

## Handling scan failures

`npm run scan` exits with a non-zero code and printed AGENT INSTRUCTIONS when it
cannot run safely. Do not retry blindly — read the message and act:

- **"No taxonomy category matches industry"** — the industry has no entry in
  `config/taxonomy.json`. The scanner will not guess a category, because scanning
  the wrong one returns unrelated results.
  1. If an existing category fits, set `industry` in `config/search.request.json`
     to one of that category's labels and re-run.
  2. If none fits, add a new category to `config/taxonomy.json` (`id`,
     `business_category`, `labels[]`, `osm_tags[]`, `places_type`,
     `places_keyword`). Copy an existing category as a template; pick OSM tags
     from the OpenStreetMap Map Features wiki. Confirm the new category with the
     user before scanning.
  3. If the industry has no physical-directory presence (purely online/B2B
     service), tell the user the Directory Scanner cannot enumerate it. Fall back
     to hand-researching `config/candidates.json` and running `npm run score`.
- **"No ISO code mapping for country"** — set `country` to a recognized name, or
  add the country to the `iso_codes` map in `config/taxonomy.json`.

Never edit `config/taxonomy.json` to force a match without confirming it is a
genuine, correct mapping. Wrong results are worse than no results.

## Guardrails

- Use only public business data. Prefer company-level over personal data.
- Never invent companies, contacts, emails, phones, or source URLs. If a field
  is unknown, leave it `null` or empty.
- The scanner (`npm run scan`) is the primary data source. Manual web research
  is only a fallback when no configured source covers the country/category.
- Do not bypass robots.txt, paywalls, logins, CAPTCHAs, or rate limits.
- Never send outreach.
