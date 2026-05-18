# /search4clients

Find real potential B2B clients by enumerating companies from public directories, scoring their fit, and exporting a reviewable lead list.

## Modes

- `/search4clients` - show the workflow and required request file.
- `/search4clients scan` - enumerate companies via Directory Scanner, score, and export.
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

## Guardrails

- Use only public business data. Prefer company-level over personal data.
- Never invent companies, contacts, emails, phones, or source URLs. If a field
  is unknown, leave it `null` or empty.
- The scanner (`npm run scan`) is the primary data source. Manual web research
  is only a fallback when no configured source covers the country/category.
- Do not bypass robots.txt, paywalls, logins, CAPTCHAs, or rate limits.
- Never send outreach.
