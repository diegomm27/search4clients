# search4clients — Score Mode

## Purpose

Score and rank pre-existing candidates in `config/candidates.json` without re-scanning sources.

## Agent flow

1. **Confirm `config/candidates.json` exists**. If missing, run `npm run scan` first.

2. **Run `npm run score`**. The scoring module (`lib/scoring/` + `lib/evaluate/`):
   - Reads candidates from `config/candidates.json`.
   - Evaluates each against the active request criteria in `config/search.request.json`.
   - Computes fit scores using the scoring rules.
   - Exports ranked results to `output/`.

3. **Run `npm run leads`** to print the ranked list.

4. **Point the user to `output/latest.html`**.

## When to use

- You already have a `candidates.json` file from manual research.
- You want to re-score with different criteria without re-scanning.
- You want to quickly evaluate a batch of candidates before a full scan.
