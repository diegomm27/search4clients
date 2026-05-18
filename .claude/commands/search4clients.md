# /search4clients

Find real potential B2B clients by researching the web, then score and export them.

## Modes

- `/search4clients` - show the workflow and required request file.
- `/search4clients scan` - read the request, research the web, score, and export.
- `/search4clients export` - export the latest scan to CSV/Markdown/JSON/HTML.

## Workflow

1. Read `AGENTS.md`.
2. Check `config/search.request.json`. If missing, run `npm run setup` or copy `config/search.request.example.json`.
3. Ask only for missing required fields:
   - What service/product does the user sell?
   - What type of clients or industry do they want?
   - What country should be searched? (City optional.)
4. Update `config/search.request.json` with the user's criteria.

5. **Research the web.** Using your own web search/fetch tools, find real companies
   that match the request:
   - Search for the `industry` in the `country` (and `city` if given).
   - Look for companies that show the `ideal_client_signals` and avoid those
     matching `exclude_signals`.
   - For each company, collect only public, company-level data: website,
     contact page, public email/phone, LinkedIn company page, a short
     description, and the source URLs you used.
   - Record the real problems you observed in `observed_signals` (e.g.
     "no online booking", "outdated website") - only what you can verify from
     public pages.
   - Aim for a thorough list. Return every genuine match; do not pre-filter
     by quality. The scan ranks them.

6. **Write `config/candidates.json`.** Use the exact shape in
   `config/candidates.example.json`. Every field must come from real research.

7. Run `npm run scan` - it scores and ranks every candidate and writes
   `output/` files.
8. Run `npm run leads` to show the ranked list.
9. Summarize the results and point the user to `output/latest.html`.

## Guardrails

- Use only public business data. Prefer company-level over personal data.
- Never invent companies, contacts, emails, phones, or source URLs. If a field
  is unknown, leave it `null` or empty.
- Every entry in `config/candidates.json` must be a real company you found,
  with real source links.
- Do not bypass robots.txt, paywalls, logins, CAPTCHAs, or rate limits.
- Never send outreach.
