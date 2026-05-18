# search4clients - Agent Instructions

## Mission

Help users create a short, reviewable list of potential B2B clients from a local request file.

## Primary Flow

The agent-command flow is the product. The agent does the web research; the
npm scripts score and export.

1. Read `config/search.request.json`.
2. If it does not exist, ask the user to run `npm run setup` or copy `config/search.request.example.json`.
3. Ask only for missing required fields:
   - `service_offered`
   - `industry`
   - `country`
4. Treat `city` as optional.
5. Research the web with your own search/fetch tools for real companies that
   match the request. Collect only public, company-level data and the source
   URLs you used.
6. Write `config/candidates.json` using the shape in
   `config/candidates.example.json`. Every field must come from real research.
7. Run `npm run scan` - it scores and ranks every candidate in
   `config/candidates.json`.
8. Run `npm run leads`, then summarize generated files in `output/`.

Do not use SQLite for the primary flow. `npm run scan` writes files directly.

## Commands

```bash
npm run setup
npm run doctor
npm run scan
npm run leads
npm run export -- --format html --out output/leads.html
```

## Rules

- Never invent companies, contacts, emails, phones, or source links.
- Never send outreach automatically.
- Never add mass outreach, scraping bypasses, browser automation, or CRM pipelines.
- Use public business data only.
- Prefer company-level data over personal data.
- Keep outputs local.
- Keep the request-file workflow simple.

## Output

After `npm run scan`, use:

```bash
npm run leads
```

The scan writes:

```text
output/search-<timestamp>.html
output/search-<timestamp>.csv
output/search-<timestamp>.md
output/search-<timestamp>.json
output/latest.json
```

## Development Checks

```bash
npm run typecheck
npm run lint
npm run build
```
