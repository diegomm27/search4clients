# search4clients

Command-based, local-first B2B client research.

search4clients turns an AI coding assistant into a simple client research workflow:

```text
Fill in a search request file
        -> run /search4clients scan or npm run scan
        -> review a short scored lead list
        -> export HTML, CSV, Markdown, or JSON
```

It is inspired by the command-based flow used by projects like `career-ops`: the user keeps a predefined local file, then asks an agent command to process it.

search4clients is not a spam tool, scraper, email sender, LinkedIn automation tool, or CRM.

## Status

Implemented today:

- `config/search.request.json` request-file workflow
- Slash-command style agent prompts for Claude, OpenCode, and Gemini
- `npm run scan` command
- Local SQLite storage
- HTML, CSV, Markdown, and JSON exports
- Next.js review dashboard
- Demo search provider with sample candidate data
- Optional OpenAI provider for outreach drafts after lead approval

The current search provider is demo-only. It is useful for testing the workflow, not live prospecting.

## How You Use It

There are two supported paths.

### Option A: Agent Command

Install and set up:

```bash
git clone https://github.com/diegomm27/search4clients.git
cd search4clients
npm install
npm run setup
npm run doctor
```

`npm run setup` creates the local request file and prepares the SQLite database. It does not create search results; `npm run scan` does that.

Open your AI coding CLI in the project:

```bash
claude
```

or:

```bash
codex
opencode
gemini
```

Edit `config/search.request.json`, or ask the agent to fill it in.

Example request:

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
  ],
  "number_of_results": 25,
  "minimum_score": 70,
  "output_format": "dashboard"
}
```

Then run the agent command:

```text
/search4clients scan
```

The agent should:

1. Read `AGENTS.md`.
2. Validate or complete `config/search.request.json`.
3. Run `npm run scan`.
4. List results with `npm run leads -- --search-id <id>`.
5. Export HTML with `npm run export -- --search-id <id> --format html --out output/search-<id>.html`.

### Option B: Plain CLI

Edit `config/search.request.json`, then run:

```bash
npm run scan
```

List results:

```bash
npm run leads
npm run leads -- --search-id 1
```

Export:

```bash
npm run export -- --search-id 1 --format html --out output/search-1.html
npm run export -- --search-id 1 --format csv --out output/search-1.csv
npm run export -- --search-id 1 --format markdown --out output/search-1.md
npm run export -- --search-id 1 --format json --out output/search-1.json
```

Open the local review dashboard:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Direct One-Off Search

You can still bypass the request file for one-off runs:

```bash
npm run search -- --service "Website redesign" --industry "Dental clinics" --country "Spain"
```

With optional city:

```bash
npm run search -- --service "Website redesign" --industry "Dental clinics" --country "Spain" --city "Madrid"
```

## Agent Files

The repository includes command/context files for common agent CLIs:

```text
AGENTS.md                               canonical project rules
CLAUDE.md                               Claude Code entry point
GEMINI.md                               Gemini CLI entry point
.claude/commands/search4clients.md      Claude slash command
.opencode/commands/search4clients.md    OpenCode command prompt
.gemini/commands/search4clients.toml    Gemini command prompt
```

The intended command is:

```text
/search4clients scan
```

Agents should prefer:

```bash
npm run doctor
npm run scan
npm run leads -- --search-id <id>
npm run export -- --search-id <id> --format html --out output/search-<id>.html
```

Agents must not invent leads, imply demo data is live research, or send outreach.

## Request File Reference

`config/search.request.json` supports:

```json
{
  "name": "Human-readable search name",
  "service_offered": "What you sell",
  "industry": "Who you want as clients",
  "country": "Required country",
  "city": "Optional city or null",
  "desired_public_data": ["website", "contact_page", "source_links"],
  "ideal_client_signals": ["old website", "no online booking"],
  "exclude_signals": ["large chains", "franchises"],
  "number_of_results": 25,
  "minimum_score": 70,
  "output_format": "dashboard"
}
```

Required fields:

- `service_offered`
- `industry`
- `country`

Optional fields:

- `city`
- `desired_public_data`
- `ideal_client_signals`
- `exclude_signals`
- `number_of_results`
- `minimum_score`

## Outputs

Supported export formats:

- HTML: easy to open and share locally
- CSV: spreadsheet workflow
- Markdown: agent-readable report
- JSON: structured data

Example:

```bash
npm run export -- --search-id 1 --format html --out output/search-1.html
```

## Configuration

The main configuration is the local request file:

```text
config/search.request.json
```

`npm run setup` creates it from:

```text
config/search.request.example.json
```

SQLite always uses the local Prisma database at `prisma/dev.db`.

### Search Provider

The only implemented search provider today is the built-in demo provider.

Future live providers must:

- use permitted public business sources
- respect robots.txt and website terms
- avoid gated/private data
- never bypass anti-bot controls
- clearly label source and confidence

### AI Provider

The AI provider is optional and currently used only for outreach draft generation after a lead is approved.

Connect it through the local Settings page. API keys are stored locally in `.data/settings.json`, used server-side only, and must never be exposed in browser code or logged in full.

## Safety Rules

- Human review is required before outreach.
- Demo data must be labeled as demo data.
- Public business data only.
- Prefer company-level data over personal data.
- Unknown fields stay empty instead of being guessed.
- Source links must not be fabricated.
- Exports are user-controlled.
- Outreach drafts are never sent automatically.

## Project Structure

```text
app/                         Next.js local review dashboard
components/                  Shared UI components
config/                      Search request examples and local request file
lib/ai/                      AI provider abstraction
lib/evaluate/                Lead evaluation logic
lib/export/                  HTML, CSV, Markdown exporters
lib/leads/                   Lead display/status helpers
lib/scoring/                 Explainable scoring
lib/search/                  Search schemas and orchestration
lib/storage/                 Prisma and JSON helpers
prisma/schema.prisma         SQLite schema
scripts/                     CLI commands
AGENTS.md                    Canonical agent instructions
CLAUDE.md                    Claude Code instructions
GEMINI.md                    Gemini CLI instructions
```

## Development

Useful commands:

```bash
npm run setup
npm run doctor
npm run scan
npm run typecheck
npm run build
```

`npm run lint` is present for Next.js, but ESLint must be configured before it can run non-interactively in this repository.

## Contributing

Good contributions:

- improve the command/request-file workflow
- improve review UX
- improve local-first storage and exports
- add safe provider abstractions
- add validation and scoring tests

Avoid:

- automatic outreach sending
- browser automation for LinkedIn or email
- mass-contact workflows
- authentication, billing, or multi-user accounts
- complex CRM pipelines

## License

MIT
