# search4clients — Export Mode

## Purpose

Export ranked candidates to HTML, CSV, Markdown, or JSON formats.

## Agent flow

1. **Confirm scan output exists**. Check `output/latest.json` or `output/` directory.

2. **Run export with desired format**:
   ```bash
   npm run export -- --format html --out output/leads.html
   npm run export -- --format csv --out output/leads.csv
   npm run export -- --format md --out output/leads.md
   npm run export -- --format json --out output/leads.json
   ```

3. **Multiple formats at once**:
   ```bash
   npm run export -- --format html --format csv --format md --out output/
   ```

## Export contents

Each export includes:
- Ranked candidate list with all fields.
- Coverage line: "N companies found across M sources."
- OSM attribution (if OSM-sourced data is included): "© OpenStreetMap contributors" (ODbL license).
- Scan timestamp and request criteria.

## When to use

- After `npm run scan` or `npm run score` to get a reviewable lead list.
- Share results with team members via HTML or Markdown.
- Import into spreadsheets via CSV.
- Integrate with other tools via JSON.
