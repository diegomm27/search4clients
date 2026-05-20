# search4clients

Find real potential clients for your product or service — straight from your AI
coding agent.

You describe who you want to sell to. search4clients enumerates real companies
from public business directories, collects their public contact details, scores
every one by how well it fits, and writes a clean ranked report you can review
and act on.

It is not a scraper-for-hire. It is not a CRM. It does not send outreach. It
produces a reviewed, ranked list of real businesses — nothing more.

## How it works

```text
config/search.request.json   ->  describe your ideal client
        |
        v
npm run scan                 ->  enumerate companies from public directories
   (or /search4clients            enrich them with public contact data
    inside your agent)            score and rank every one
        |
        v
output/search-<timestamp>.*  ->  your ranked list of potential clients
```

`npm run scan` runs the whole pipeline in one step — it enumerates, enriches,
scores, and exports automatically.

## Requirements

- [Node.js](https://nodejs.org) 18.17 or newer
- One AI coding agent CLI installed: [Claude Code](https://claude.com/claude-code),
  Codex, [Gemini CLI](https://github.com/google-gemini/gemini-cli), or OpenCode

Check Node:

```bash
node --version
```

## Quick start

### 1. Get the project

```bash
git clone https://github.com/diegomm27/search4clients.git
cd search4clients
npm install
```

### 2. Describe your ideal client

```bash
npm run setup
```

This creates `config/search.request.json` from the template. Open it and
describe who you want to reach:

```json
{
  "name": "Madrid dental clinics for website redesign",
  "service_offered": "Website redesign",
  "industry": "Dental clinics",
  "country": "Spain",
  "city": "Madrid",
  "ideal_client_signals": [
    "old website",
    "no online booking"
  ],
  "exclude_signals": [
    "large chains",
    "franchises"
  ],
  "minimum_score": 20
}
```

Only three fields are required: `service_offered`, `industry`, and `country`.
Everything else is optional. `city` narrows the search to one city; leave it out
to search the whole country.

### 3. Check the setup

```bash
npm run doctor
```

This confirms Node, the request file, and your configuration are in order.

### 4. Run it

**With your AI agent (recommended).** Open your agent in this folder and run the
command. The agent fills in any missing details, runs the scan, and walks you
through the results.

```bash
claude      # or codex, gemini, opencode
```

```text
/search4clients
```

**Directly.** If your request file is complete, just run the pipeline yourself:

```bash
npm run scan
```

Either way, `npm run scan` enumerates matching companies from public
directories, enriches each with public contact data (website, email, phone),
scores them by fit, and writes the report.

### 5. Get your list

Print the ranked list in your terminal:

```bash
npm run leads
```

For a browser-friendly report, open the newest `output/search-<timestamp>.html`
file in `output/`.

That's it — a reviewed, scored list of potential clients ready for manual
outreach.

## The request file

| Field | Required | Description |
| --- | --- | --- |
| `service_offered` | yes | What you sell |
| `industry` | yes | The kind of client you want |
| `country` | yes | Country to search |
| `city` | no | Narrow the search to one city |
| `name` | no | A label for this search |
| `ideal_client_signals` | no | Buying signals that make a company a better fit |
| `exclude_signals` | no | Signals that disqualify a company — matches drop out |
| `minimum_score` | no | Fit score (0–100) below which leads are dropped; defaults to 20 |
| `desired_public_data` | no | Extra public fields to collect per company |

Every company scoring at or above `minimum_score` that has at least one public
contact channel is returned, ranked by fit.

## Outputs

Each run writes timestamped files:

```text
output/search-<timestamp>.html   human-readable report
output/search-<timestamp>.csv    for spreadsheets
output/search-<timestamp>.md     for agents and docs
output/search-<timestamp>.json   full structured data
```

Re-export the latest run in any format:

```bash
npm run export -- --format html --out output/leads.html
npm run export -- --format csv  --out output/leads.csv
```

## Commands

```bash
npm run setup    # create config/search.request.json from the template
npm run doctor   # check your local setup
npm run scan     # enumerate -> enrich -> score -> export (the main command)
npm run enrich   # fetch public contact data for config/candidates.json
npm run score    # score an existing config/candidates.json and export
npm run leads    # print the ranked list from the latest run
npm run export   # re-export the latest run in another format
```

## Safety

search4clients is built to give you trustworthy leads, not shortcuts:

- Only public, company-level business data is collected
- No fabricated companies, contacts, emails, phones, or source links
- No automatic outreach — every message is yours to write and send
- No mass email or LinkedIn automation
- No bypassing robots.txt, paywalls, logins, CAPTCHAs, or rate limits
- You review the list before taking any action

## Project structure

```text
config/search.request.example.json   request-file template
config/candidates.example.json        candidate-file shape
scripts/                              setup, doctor, scan, enrich, score, leads, export
lib/                                  scanner, enrichment, scoring, exporters, schemas
AGENTS.md                             canonical agent instructions
.claude/ .gemini/ .opencode/          per-agent command definitions
```

## Development

```bash
npm run typecheck
npm test
```

## License

MIT
