# search4clients - Agent Instructions

## Core mission

Help users find better potential B2B clients through guided research, transparent scoring, and human review.

## Product principles

- Simplicity first
- Human-in-the-loop
- Public business data only
- No mass outreach
- No fabricated leads
- No automatic sending
- Quality over quantity
- Local-first by default

## Main workflow

1. User describes service, target clients, country, optional city, and desired public data.
2. App creates a simple search config.
3. App generates or retrieves candidate companies.
4. App scores candidates transparently.
5. User reviews leads.
6. User approves or rejects.
7. User exports or drafts outreach manually.

## Agent-native workflow

search4clients is designed to work from AI coding CLIs such as Claude Code, Codex, OpenCode, and Gemini CLI.

When a user asks to find potential clients:

1. Read `config/search.request.json` if it exists.
2. If missing, copy `config/search.request.example.json` or run `npm run setup`.
3. Ask only for missing required inputs:
   - service or product offered
   - target client type or industry
   - country
4. Treat city as optional.
5. Update `config/search.request.json`.
6. Run `npm run doctor` if setup may be incomplete.
7. Run `npm run scan`.
8. Use `npm run leads -- --search-id <id>` to summarize results in the terminal.
9. Export HTML by default with `npm run export -- --search-id <id> --format html --out output/search-<id>.html`.
10. Suggest `npm run dev` for visual review in the local dashboard.

Useful commands:

```bash
npm run doctor
npm run scan
npm run search -- --service "Website redesign" --industry "Dental clinics" --country "Spain"
npm run leads
npm run export -- --format html --out output/leads.html
npm run dev
```

## Agent rules

- Prefer removing fields over adding fields.
- Prefer plain language over technical labels.
- Hide advanced details by default.
- Never imply demo data is live research.
- Keep city optional and country mandatory.
- Separate AI-provider setup from search-provider setup.
- Never implement automatic email or LinkedIn sending.
- Never bypass robots.txt, paywalls, auth, CAPTCHAs, or rate limits.
- Always require human review before outreach.
- Use company-level public data over personal data.
- Keep setup and first run simple.
- Prefer deterministic npm scripts over ad hoc database writes.
- If using a coding agent, keep all generated data in the local project.

## Data and source expectations

- Demo provider is sample data only.
- OpenAI/API settings may power draft generation, not live search.
- Real search providers must be clearly labeled and respect permitted public sources.
- Source links must not be fabricated.
- Unknown emails and phones should remain empty or null.
- Separate factual observations from AI interpretation.

## Development checks

- `npm run typecheck`
- `npm run build`
- `npm run lint` if it works in this project
