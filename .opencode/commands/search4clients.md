# search4clients

Find real potential B2B clients by researching the web, then score and export them.

Read `AGENTS.md` first. This is a command-based workflow.

## Workflow

1. Check `config/search.request.json`. If missing, copy
   `config/search.request.example.json` or run `npm run setup`.
2. Ask only for missing required fields: service, industry/client type, and
   country. City is optional. Update `config/search.request.json`.

3. Research the web with your own search tools. Find real companies that match
   the request - the right `industry` in the `country`/`city`, showing the
   `ideal_client_signals`, not matching `exclude_signals`. For each, gather only
   public company-level data and the source URLs you used.

4. Write `config/candidates.json` using the shape in
   `config/candidates.example.json`. Every field must come from real research.
5. Run `npm run scan`, then `npm run leads`, then point the user to
   `output/latest.html`. Optionally
   `npm run export -- --format html --out output/leads.html`.

## Guardrails

- Use only public business data. Never invent companies, contacts, or source
  links - leave unknown fields `null` or empty.
- Do not bypass robots.txt, paywalls, logins, CAPTCHAs, or rate limits.
- Never send outreach automatically.
