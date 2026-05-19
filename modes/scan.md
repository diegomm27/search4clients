# search4clients — Scan Mode

## Purpose

Enumerate real companies from configured directory sources, score fit, and export a ranked lead list.

## Agent flow

1. **Read `config/search.request.json`**. If missing, ask the user for the 3 required fields:
   - `service_offered` — what your product/service does
   - `industry` — target client industry (from `config/taxonomy.json` categories)
   - `country` — target country ISO code (from `config/taxonomy.json`)
   - `city` — optional, for geo-constrained searches

2. **Update `config/search.request.json`** with the completed request.

3. **Run `npm run doctor`** to verify setup (Node, Playwright, .env keys, sources.json, taxonomy.json).

4. **Run `npm run scan`**. The scanner:
   - Reads `config/sources.json` for enabled sources matching the request country.
   - Queries each enabled source via the Directory Scanner (`lib/scan/`).
   - Deduplicates results by name + geo + domain.
   - Scores each candidate against the request criteria.
   - **Enriches every candidate** — fetches sites, extracts contact data — then re-scores.
   - Exports to `output/` every candidate scoring at or above `minimum_score`.

   Enrichment is automatic and built into `npm run scan`. Do not prompt the
   user to run `npm run enrich` separately as a follow-up step.

5. **Run `npm run leads`** to print the ranked list.

6. **Point the user to `output/latest.html`** and other output files.

## Source selection

The agent checks `config/sources.json` for sources enabled for the target country:

| Source | Key required | Coverage |
|--------|-------------|----------|
| `osm-overpass` | No | Global physical businesses |
| `google-places` | `GOOGLE_PLACES_API_KEY` | Global physical + service businesses |
| Browser directories | No (ToS-verified) | Country-specific directories |

If no source is enabled for the requested country, tell the user and ask whether to:
- Proceed with Overpass/Places only.
- Add a new browser directory source to `config/sources.json`.

## Pagination and rate limits

- Overpass: max ~1 req/s, polite delay between queries.
- Places API: respect `X-RateLimit-*` headers, polite delay.
- Browser directories: follow `sources.json` selectors, stop conditions, polite delays.

## Output

After `npm run scan`, output files are:

```
output/search-<timestamp>.html    full lead list with scoring
output/search-<timestamp>.csv
output/search-<timestamp>.md
output/search-<timestamp>.json
output/latest.*                   always points to the most recent scan
```

Each export includes a coverage line: "N companies found across M sources."
