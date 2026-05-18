# search4clients for Gemini CLI

Read `AGENTS.md` first. Use this repository as a local-first agent workspace for finding potential B2B clients.

Use these commands:

- `npm run doctor`
- `npm run scan`
- `npm run leads`
- `npm run export -- --format html --out output/leads.html`

Flow: read `config/search.request.json` (ask only for missing required fields),
research the real web for matching companies, write the results to
`config/candidates.json` using the shape in `config/candidates.example.json`,
then run `npm run scan`. The scan scores and ranks the candidates you wrote.

Keep the workflow human-in-the-loop. Never send outreach automatically and
never invent lead data — every candidate must be a real company with real
source links.
