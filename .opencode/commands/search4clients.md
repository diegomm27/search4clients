# search4clients

Find potential B2B clients through the local search4clients workflow.

Read `AGENTS.md`. This is a command-based workflow.

Default mode:

```bash
npm run scan
```

`npm run scan` reads `config/search.request.json`. If that file is missing, copy `config/search.request.example.json` or run `npm run setup`.

After the scan, list and export:

```bash
npm run leads -- --search-id <id>
npm run export -- --search-id <id> --format html --out output/search-<id>.html
```

Ask only for missing required fields: service, industry/client type, and country. City is optional.

Never send outreach automatically. Never invent companies, contacts, or sources. Demo mode is not live research.
