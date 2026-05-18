# search4clients — Shared Mode Context

This context is loaded by all modes. It contains shared state, types, and conventions.

## Shared types

```typescript
interface CandidateCompany {
  name: string;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string;
  industry: string;
  category: string;
  source: string;
  source_url: string | null;
  latitude: number | null;
  longitude: number | null;
  ideal_client_signals: string[];
  exclude_signals: string[];
  notes: string | null;
}
```

## Config files

| File | Purpose |
|------|---------|
| `config/search.request.json` | Active search request (service, industry, country, city) |
| `config/sources.json` | Enabled/disabled directory sources with selectors |
| `config/taxonomy.json` | 30 categories, 70 country codes, OSM tags, Places types |
| `config/candidates.json` | Intermediate: deduplicated candidate list |

## Output

| File | Purpose |
|------|---------|
| `output/search-<timestamp>.json` | Full scan results with scores |
| `output/search-<timestamp>.html` | Human-readable lead list |
| `output/search-<timestamp>.csv` | Spreadsheet-friendly export |
| `output/search-<timestamp>.md` | Markdown export |
| `output/latest.*` | Symlink/alias to most recent scan |

## Scanning policy (locked)

- ToS-compliant Playwright navigation allowed.
- No CAPTCHA bypass, paywall bypass, auth bypass, robots.txt bypass, or rate limit evasion.
- No proxy rotation or fingerprint spoofing.
- Google data via Places API only — never scrape Google Maps.
- OSM exports must carry "© OpenStreetMap contributors" (ODbL).
- Never send outreach — human-in-the-loop always.
- Never invent companies, contacts, emails, or sources.
