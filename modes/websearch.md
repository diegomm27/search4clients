# search4clients — Web Search Mode

## Purpose

Supplement the structured scanner (OSM Overpass) with businesses found via
open-web search. The `npm run scan` pipeline is pure deterministic code and has
no search capability — **you, the agent, perform the searches**, extract real
businesses from the results, and write them to a findings file. `npm run
websearch` then validates and merges that file into `config/candidates.json`.

## When to use this mode

- As a **supplement** after `npm run scan`, to fill gaps OSM missed.
- As a **fallback** when the structured scanner returns too few results, or when
  the industry has weak directory coverage.

This mode is not a replacement for `npm run scan`. Run the structured scan first
when possible — it enumerates; web search only samples.

## The honest limitation — read this

Web search **samples**, it does not **enumerate**. A search for "bookstores in
Badajoz" returns whatever the search engine chooses to surface — typically the
top tens of results, not every bookstore in the province. Treat web-search
results as leads to verify, never as a complete market census.

Because of this, every business you record here is automatically tagged
`needs-verification (web-search sourced)` when merged. Do not try to hide or
strip that tag — it is what keeps the exported report honest.

## Agent flow

1. **Read `config/search.request.json`** for `industry`, `country`, `city`,
   `ideal_client_signals`, `exclude_signals`.

2. **Decide the search granularity.**
   - If `city` is set, search that city only.
   - Otherwise, search **province by province** (or state/region) so each query
     is narrow enough to return useful local results. For Spain, that means
     iterating the provinces — Álava, Albacete, Alicante, Almería, … Badajoz,
     Cáceres, … Sevilla, … (use `config/region-mapping.json` as the region list
     once it is populated; otherwise use your own knowledge of the country's
     provinces).

3. **Decide the search language.** Search in the **country's primary language**
   when it yields better local results — for Spain, search in Spanish
   (`librerías en Badajoz`, not `bookstores in Badajoz`). Record the language
   you used in the findings file. You may run both languages if it helps.

4. **For each region, search and extract.**
   - Run searches like `librerías independientes en <province>`.
   - Open and read the result pages. Extract **only real businesses you can see
     on a real page** — name, website, phone, email, a short description, and
     any observed signals relevant to `ideal_client_signals`.
   - Record the actual URL(s) you read for each business in `source_urls`.
     A business with no source URL **must not** be included.
   - Skip anything matching `exclude_signals` (chains, franchises, closed).

5. **Never invent.** If you cannot find a website, phone, or email, leave it
   `null`. Do not guess contact details. Do not list a business you did not
   actually see on a page. A short, real list beats a long, fabricated one.

6. **Respect the scanning policy.** Honor robots.txt, rate limits, paywalls,
   logins, and CAPTCHAs. Do not bypass any of them. Do not scrape Google Maps
   or Google Search result pages directly — use normal search and read the
   public business pages it links to.

7. **Write `config/websearch-findings.json`** in the schema below.

8. **Run `npm run websearch`** to validate and merge into `config/candidates.json`.

9. **Run `npm run score`** to score and export the merged list.

## Findings file schema

Write `config/websearch-findings.json`:

```json
{
  "generated_by": "agent-websearch",
  "generated_at": "2026-05-19T12:00:00.000Z",
  "request_name": "Spain local independent bookstores for FindYourBook partnerships",
  "search_language": "es",
  "regions_searched": ["Badajoz", "Cáceres", "Sevilla"],
  "findings": [
    {
      "company_name": "Librería Ejemplo",
      "region": "Badajoz",
      "city": "Badajoz",
      "website": "https://libreriaejemplo.es",
      "public_email": "hola@libreriaejemplo.es",
      "public_phone": "+34 924 00 00 00",
      "company_description": "Independent neighbourhood bookshop hosting weekly book clubs.",
      "observed_signals": ["hosts book clubs", "active on Instagram"],
      "source_urls": ["https://libreriaejemplo.es/contacto"]
    }
  ]
}
```

Field rules:

- `generated_by` must be exactly `"agent-websearch"`.
- `findings[].company_name` — required, non-empty.
- `findings[].source_urls` — required, at least one real URL you read.
- All other fields — use `null` (or omit, or `[]` / `""`) when unknown. Never guess.

## What `npm run websearch` does

- Validates `config/websearch-findings.json` against the schema (rejects any
  finding with no name or no source URL).
- Converts findings to candidates, tagging each with a `websearch:` source
  prefix and the `needs-verification` signal.
- Deduplicates against any existing `config/candidates.json` (by name + phone +
  website) and merges — so you can run it after `npm run scan` to combine both.
- Writes the merged list back to `config/candidates.json`.

After merging, run `npm run score`.
