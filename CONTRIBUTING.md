# Contributing to search4clients

Thank you for your interest in contributing.

## How to contribute

1. **Fork** the repository.
2. **Create a branch** for your feature or fix: `git checkout -b feature/my-feature`
3. **Make your changes**. Ensure `npm run typecheck` passes.
4. **Add tests** for new logic in `tests/`.
5. **Run tests**: `npm test`
6. **Submit a pull request**.

## Adding a directory source

Browser directory sources let the scanner navigate public company directories.

### Step 1: Edit `config/sources.json`

Add a new entry under the `sources` array:

```json
{
  "id": "my-city-directory",
  "enabled": true,
  "kind": "browser",
  "country": "IT",
  "category": "bookstore",
  "playwright": {
    "entryUrl": "https://example-directory.com/search/{KEYWORD}/{LOCATION}",
    "selectors": {
      "item": ".business-card",
      "name": ".name",
      "address": ".address",
      "phone": ".phone a",
      "website": ".website-link",
      "email": ".email-link"
    },
    "paginationType": "query-param",
    "paginationParam": "page",
    "maxPages": 20,
    "delayMs": 1500,
    "stopCondition": "max-pages"
  },
  "notes": "Public business directory for Italian cities."
}
```

### Step 2: Field reference

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Unique identifier |
| `enabled` | yes | Toggle on/off |
| `kind` | yes | Must be `"browser"` |
| `country` | yes | ISO country code this source covers |
| `category` | yes | Category ID from `config/taxonomy.json` |
| `playwright.entryUrl` | yes | URL template with `{KEYWORD}` and `{LOCATION}` placeholders |
| `playwright.selectors.item` | yes | CSS selector for each business card/row |
| `playwright.selectors.name` | yes | CSS selector for the business name |
| `playwright.selectors.address` | no | CSS selector for the address |
| `playwright.selectors.phone` | no | CSS selector for the phone number |
| `playwright.selectors.website` | no | CSS selector for the website link |
| `playwright.selectors.email` | no | CSS selector for the email |
| `playwright.paginationType` | no | `"query-param"` or `"button"` |
| `playwright.paginationParam` | no | Query param name (e.g. `"page"`) |
| `playwright.maxPages` | no | Max pages to paginate (default: 50) |
| `playwright.delayMs` | no | Delay between page loads (default: 1500) |
| `playwright.stopCondition` | no | `"max-pages"`, `"empty-page"`, or `"no-next-button"` |

### Step 3: Verify

```bash
npm run doctor
npm run scan
```

Check `config/candidates.json` and `output/` for results from your source.

### Important

- Only add sources whose `robots.txt` and Terms of Service permit automated access.
- Always set reasonable `delayMs` values (1000ms+).
- Set `enabled: false` while testing, then flip to `true` after verifying.
