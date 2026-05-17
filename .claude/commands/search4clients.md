# /search4clients

Find potential B2B clients using the local search4clients workflow.

## Modes

- `/search4clients` - show the workflow and required request file.
- `/search4clients scan` - read `config/search.request.json`, run the scan, then export HTML.
- `/search4clients export` - export the latest or requested search to CSV/Markdown/JSON/HTML.

## Instructions

1. Read `AGENTS.md`.
2. Check whether `config/search.request.json` exists. If not, run `npm run setup` or copy `config/search.request.example.json`.
3. Ask only for missing required fields in the request file:
   - What service/product does the user sell?
   - What type of clients or industry do they want?
   - What country should be searched?
   - City is optional.
4. Update `config/search.request.json` when the user provides search criteria.
5. Run `npm run doctor` if setup is uncertain.
6. For scan mode, run `npm run scan`.
7. After scan, run `npm run leads -- --search-id <id>`.
8. Export with `npm run export -- --search-id <id> --format html --out output/search-<id>.html` unless the user requests another format.
9. Summarize saved results and point to the HTML export or `npm run dev`.

## Guardrails

Use public business data only. Do not send outreach. Do not invent leads or source links. Demo mode is sample data only.
