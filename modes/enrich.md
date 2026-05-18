# search4clients — Enrich Mode

## Purpose

Fetch company websites for existing candidates in `config/candidates.json` (or the latest scan output), detect public signals, and enrich the candidate records.

## Agent flow

1. **Confirm candidates exist**. Check `output/latest.json` or `config/candidates.json`.

2. **Run enrichment**. The enrich module (`lib/enrich/`) will:
   - Fetch each candidate's website (respecting robots.txt, rate limits, no JS-only content as fallback).
   - Detect `observed_signals` from public page content:
     - Contact page presence and public email/phone
     - Pricing page (indicates willingness to pay for tools)
     - Blog/news section (indicates active business)
     - Tech stack hints (CMS, analytics, booking systems)
     - Hiring pages (indicates growth)
     - Social media links
   - Update the candidate record with enriched data.

3. **Review enriched candidates**. Run `npm run leads` to see the updated list.

## Safety

- Respect `robots.txt` and rate limits.
- No JS execution for data collection (use fetch/HTTP only).
- No personal data — company-level public data only.
- If a site blocks access, mark `enrichment_failed: true` and continue.

## Output

Enriched candidates are written back to `output/search-<timestamp>.json` and the next export will include the new `observed_signals` field.
