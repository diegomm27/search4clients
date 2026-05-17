# search4clients for Gemini CLI

Read `AGENTS.md` first. Use this repository as a local-first agent workspace for finding potential B2B clients.

Use these commands:

- `npm run doctor`
- `npm run scan`
- `npm run leads`
- `npm run export -- --format html --out output/leads.html`
- `npm run dev`

`npm run scan` reads `config/search.request.json`. Ask only for missing required fields before updating that file.

Keep the workflow human-in-the-loop. Never send outreach automatically and never invent lead data.
