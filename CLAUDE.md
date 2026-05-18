# search4clients for Claude Code

Read `AGENTS.md` first. It is the canonical instruction file for this project.

## Fast start

When the user asks to find potential clients:

1. Read or create `config/search.request.json`.
2. Ask only for missing required details: service, target client type or industry, and country. City is optional.
3. Update `config/search.request.json`.
4. Research the web with your own search/fetch tools for real companies matching the request. Collect only public, company-level data plus the source URLs you used.
5. Write `config/candidates.json` using the shape in `config/candidates.example.json`.
6. Run `npm run doctor` if setup is uncertain.
7. Run `npm run scan` (it scores and ranks `config/candidates.json`).
8. Run `npm run leads`.
9. Point the user to `output/latest.html` or the timestamped files in `output/`.

## Safety

- Never invent companies, contacts, emails, phones, or source links. Every candidate must be a real company you found.
- Never send outreach.
- Do not bypass robots.txt, paywalls, authentication, CAPTCHAs, or rate limits.
- Unknown fields stay empty or null.
