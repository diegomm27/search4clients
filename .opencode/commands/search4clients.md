# search4clients

Find real potential B2B clients by enumerating companies from public directories, scoring their fit, and exporting a reviewable lead list.

Read `AGENTS.md` first. This is a command-based workflow.

## Primary flow

1. Check `config/search.request.json`. If missing, copy
   `config/search.request.example.json` or run `npm run setup`.
2. Ask only for missing required fields: service, industry/client type, and
   country. City is optional. Update `config/search.request.json`.
3. Run `npm run doctor` to verify setup (Node, Playwright, .env keys, config files).
4. Run `npm run scan` — the scanner enumerates companies from public directories
   (Overpass API, Google Places, browser directories), scores them, and exports.
5. Run `npm run leads` to print the ranked list.
6. Point the user to `output/latest.html` or the timestamped files in `output/`.

## Alternative flows

- **Enrich only**: If you already have `config/candidates.json` from a previous scan,
  run `npm run enrich` to fetch company sites, extract contact data, and detect signals.
- **Score only**: If you have a hand-written `candidates.json` (e.g., from manual research),
  run `npm run score` to score and rank them. **Never** use `npm run scan` for hand-written
  files — it overwrites `candidates.json`.

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

## Guardrails

- Use only public business data. Never invent companies, contacts, or source
  links — leave unknown fields `null` or empty.
- Do not bypass robots.txt, paywalls, logins, CAPTCHAs, or rate limits.
- Never send outreach automatically.
- The scanner (`npm run scan`) is the primary data source. Manual web research
  is only a fallback when no configured source covers the country/category.
