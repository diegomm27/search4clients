# search4clients for Claude Code

Read `AGENTS.md` first. It is the canonical instruction file for this project.

## Fast start

When the user asks to find potential clients:

1. Read or create `config/search.request.json`.
2. Ask only for missing required details: service, target client type or industry, and country. City is optional.
3. Update `config/search.request.json`.
4. Run `npm run doctor` if setup is uncertain.
5. Run `npm run scan`.
6. Run `npm run leads -- --search-id <id>`.
7. Export HTML with `npm run export -- --search-id <id> --format html --out output/search-<id>.html`, unless the user requests CSV/Markdown/JSON.
8. Tell the user they can also review results with `npm run dev`.

## Safety

- Demo search data is sample data only.
- Do not imply live web research unless a real permitted search provider exists.
- Never send outreach.
- Do not bypass robots.txt, paywalls, authentication, CAPTCHAs, or rate limits.
- Unknown fields stay empty or null.
