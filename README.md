# search4clients

Find real potential clients for your product or service — with an AI coding agent.

You describe who you want to sell to. Your agent (Claude, Codex, Gemini, or
OpenCode) researches the real web, finds matching companies, and collects their
public contact details. search4clients then scores and ranks every company by
fit and writes a clean report you can review and act on.

It is not a scraper. It is not a CRM. It does not send outreach. It produces a
reviewed, ranked list of real businesses — nothing more, nothing less.

## How it works

```text
config/search.request.json   ->  you describe your ideal client
        |
        v
/search4clients (in your agent) ->  agent researches the web
        |
        v
config/candidates.json       ->  real companies the agent found
        |
        v
npm run scan                 ->  scores and ranks every company
        |
        v
output/latest.html           ->  your ranked list of potential clients
```

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

### 2. Create your request file

```bash
npm run setup
```

This copies `config/search.request.example.json` to
`config/search.request.json`. Open it and describe your ideal client:

```json
{
  "name": "Madrid dental clinics for website redesign",
  "service_offered": "Website redesign",
  "industry": "Dental clinics",
  "country": "Spain",
  "city": "Madrid",
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

Only three fields are required: `service_offered`, `industry`, and `country`.
Everything else is optional. `city` narrows the search to one city; leave it
out to search the whole country.

### 3. Check the setup

```bash
npm run doctor
```

This confirms Node, the request file, and the candidate file are in order.

### 4. Run the research with your agent

Open your agent in this folder:

```bash
claude
```

(or `codex`, `gemini`, `opencode`)

Then run the command:

```text
/search4clients
```

The agent will:

1. Read your `config/search.request.json`.
2. Ask for any missing required details.
3. Research the public web for real companies that match.
4. Write everything it finds to `config/candidates.json`.
5. Run `npm run scan` to score and rank them.
6. Show you the results in `output/`.

### 5. Get your list of clients

The scan writes a ranked report. Open it in your browser:

```text
output/latest.html
```

Or print the ranked list in your terminal:

```bash
npm run leads
```

That's it. You now have a reviewed, scored list of potential clients ready for
manual outreach.

## The request file

| Field | Required | Description |
| --- | --- | --- |
| `service_offered` | yes | What you sell |
| `industry` | yes | The kind of client you want |
| `country` | yes | Country to search |
| `city` | no | Narrow the search to one city |
| `name` | no | A label for this search |
| `ideal_client_signals` | no | Buying signals that make a company a better fit |
| `exclude_signals` | no | Signals that disqualify a company |
| `desired_public_data` | no | Extra public fields to collect per company |

Every matching company is returned, ranked by fit score. Lower-scoring
companies still appear so you can review the full list yourself.

## Outputs

Each scan writes timestamped files plus a `latest` copy of each:

```text
output/search-<timestamp>.html   human-readable report
output/search-<timestamp>.csv    for spreadsheets
output/search-<timestamp>.md     for agents and docs
output/search-<timestamp>.json   full structured data
output/latest.html               most recent run
output/latest.csv
output/latest.md
output/latest.json
```

Re-export the latest scan in any format:

```bash
npm run export -- --format html --out output/leads.html
npm run export -- --format csv  --out output/leads.csv
```

## Commands

```bash
npm run setup    # create config/search.request.json from the template
npm run doctor   # check your local setup
npm run scan     # score config/candidates.json and write output/
npm run leads    # print the ranked list
npm run export   # re-export the latest scan
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
scripts/                              setup, doctor, scan, leads, export
lib/                                  scoring, evaluation, exporters, schemas
AGENTS.md                             canonical agent instructions
.claude/ .gemini/ .opencode/          per-agent command definitions
```

## Development

```bash
npm run typecheck
```

## License

MIT
