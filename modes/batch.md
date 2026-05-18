# search4clients — Batch Mode

## Purpose

Run parallel multi-region or multi-category scans to cover broad markets.

## Agent flow

1. **Design the batch plan**. Decide on regions and/or categories to scan:
   - **Multi-region**: same category, multiple countries.
   - **Multi-category**: same region, multiple categories.
   - **Full grid**: all region × category combinations.

2. **Update `config/search.request.json`** with the first batch item.

3. **Run `npm run scan`** for each batch item. The agent should run these in parallel where possible, respecting:
   - Rate limits (polite delays between API calls).
   - Source-specific pagination limits.
   - No concurrent requests to the same source beyond its rate limit.

4. **Merge results**. After all batch items complete:
   - Run deduplication across all result sets.
   - Score the combined candidate list.
   - Export the unified results.

5. **Run `npm run leads`** and point to `output/latest.html`.

## Batch configuration

For multi-region scans, update the request and re-run:

```json
{
  "service_offered": "your service",
  "industry": "dentistry",
  "country": "ES",
  "city": null
}
```

For multi-category scans, update the industry/category field.

## Parallel execution tips

- Overpass: max 1 req/s per source, but you can query different countries in parallel.
- Places API: respect rate limit headers; different API keys can be used for different sub-tasks.
- Browser directories: follow each directory's pagination limits and delays.
- If a source fails mid-scan, log the error and continue with other sources.

## Output

Each batch run produces its own timestamped output file. After all runs complete, merge into a single `config/candidates.json` for final scoring and export.
