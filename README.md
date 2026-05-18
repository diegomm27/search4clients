# search4clients

Plug-and-play, command-based B2B client research for AI coding agents.

search4clients has one primary flow:

```text
Edit config/search.request.json
        -> run /search4clients scan in your agent
        -> agent researches the web -> config/candidates.json
        -> npm run scan scores and ranks the candidates
        -> get output/latest.html, output/latest.csv, output/latest.md, output/latest.json
```

It is not a web app first. It is not a CRM. It is not an outreach automation tool.

## How It Works

The agent does the research; the npm scripts score and export.

- You describe what you want in `config/search.request.json`.
- Your AI agent (claude, codex, opencode, gemini) reads that file, **researches
  the real web** with its own search tools, and writes the companies it finds
  to `config/candidates.json`.
- `npm run scan` scores and ranks every candidate, then writes the report files.

## What Works Today

- One request file: `config/search.request.json`
- One command: `/search4clients scan`
- Agent-driven live web research into `config/candidates.json`
- File-based outputs in `output/`
- No SQLite, database, or API key required for the agent command flow
- HTML, CSV, Markdown, and JSON output
- Optional local dashboard for manual review

## Install

```bash
git clone https://github.com/diegomm27/search4clients.git
cd search4clients
npm install
npm run setup
npm run doctor
```

`npm run setup` only creates the local request file from the template:

```text
config/search.request.example.json -> config/search.request.json
```

It does not create a database and it does not run a scan.

## Use With An Agent

Open your agent CLI in this repo:

```bash
claude
```

or:

```bash
codex
opencode
gemini
```

Then run:

```text
/search4clients scan
```

The agent should:

1. Read `AGENTS.md`.
2. Read or create `config/search.request.json`.
3. Ask only for missing required fields.
4. Research the web for real companies that match the request.
5. Write the findings to `config/candidates.json` (see `config/candidates.example.json`).
6. Run `npm run scan` to score and rank them.
7. Run `npm run leads` and summarize the generated files in `output/`.

## Request File

Example:

```json
{
  "name": "Spain dental clinics for website redesign",
  "service_offered": "Website redesign",
  "industry": "Dental clinics",
  "country": "Spain",
  "city": null,
  "desired_public_data": [
    "website",
    "contact_page",
    "company_description",
    "source_links"
  ],
  "ideal_client_signals": [
    "old website",
    "no online booking",
    "poor mobile design"
  ],
  "exclude_signals": [
    "large chains",
    "franchises"
  ]
}
```

Required:

- `service_offered`
- `industry`
- `country`

Optional:

- `city`
- `desired_public_data`
- `ideal_client_signals`
- `exclude_signals`

Every matching company is returned, ranked by fit score. There is no minimum-score cutoff: lower-scoring companies still appear so you can review the full list.

## Run Without An Agent

`npm run scan` needs a `config/candidates.json` file. The agent writes it from
real web research using the `/search4clients scan` command.

Write `config/candidates.json` (see `config/candidates.example.json`) and run:

```bash
npm run scan
```

List the latest results:

```bash
npm run leads
```

Export from the latest scan:

```bash
npm run export -- --format html --out output/leads.html
npm run export -- --format csv --out output/leads.csv
npm run export -- --format markdown --out output/leads.md
npm run export -- --format json --out output/leads.json
```

Edit the request file in your text editor or ask your agent to update it, then run the agent command again.

## Outputs

Every scan writes:

```text
output/search-<timestamp>.html
output/search-<timestamp>.csv
output/search-<timestamp>.md
output/search-<timestamp>.json
output/latest.json
output/latest.html
output/latest.csv
output/latest.md
```

HTML is the default human-readable report. CSV is for spreadsheets. Markdown is agent-readable. JSON is the full structured scan output.

## Optional Dashboard

The command flow does not require SQLite.

The repository still includes a local Next.js dashboard for manual review experiments:

```bash
npm run dev
```

Open `http://localhost:3000`.

The dashboard uses Prisma/SQLite internally. It is optional and not part of the primary agent-command flow.

## Agent Files

```text
AGENTS.md                               canonical agent rules
CLAUDE.md                               Claude Code entry point
GEMINI.md                               Gemini CLI entry point
.claude/commands/search4clients.md      Claude slash command
.opencode/commands/search4clients.md    OpenCode command prompt
.gemini/commands/search4clients.toml    Gemini command prompt
```

## Safety Rules

- Public business data only
- No fabricated companies, contacts, phone numbers, emails, or source links
- No automatic outreach sending
- No mass email or LinkedIn automation
- No bypassing robots.txt, paywalls, authentication, CAPTCHAs, or rate limits
- Human review before outreach

## Project Structure

```text
config/search.request.example.json      request-file template
scripts/search.ts                       scan command
scripts/leads.ts                        latest-result summary
scripts/export.ts                       output converter
lib/search/                             candidate schemas and loader
lib/evaluate/                           lead evaluation
lib/export/                             HTML/CSV/Markdown exporters
app/                                    optional local dashboard
prisma/                                 optional dashboard storage schema
```

## Development

```bash
npm run typecheck
npm run lint
npm run build
```

## License

MIT
