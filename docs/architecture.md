# Architecture

search4clients is a command-based B2B client research workspace for AI coding agents.

The interface is `/search4clients` (agent) and `npm run scan` (CLI). The scan reads `config/search.request.json` and `config/candidates.json`, then writes report files to `output/`. There is no database or web server.

## Product Flow

1. User or agent edits `config/search.request.json`.
2. Agent researches the web and writes `config/candidates.json`.
3. Agent runs `npm run scan`.
4. Evaluation scores candidates with explainable reasons.
5. The scan writes HTML, CSV, Markdown, and JSON files to `output/`.
6. User reviews the files manually.

## Boundaries

- `scripts/search.ts`: primary scan command.
- `scripts/leads.ts`: terminal summary of `output/latest.json`.
- `scripts/export.ts`: format conversion from `output/latest.json`.
- `config/search.request.example.json`: request-file template.
- `lib/search/`: request schema and candidate loader.
- `lib/evaluate/`: candidate evaluation.
- `lib/scoring/`: score calculation.
- `lib/export/`: HTML, CSV, and Markdown exporters.

## Candidate Sources

Agents (Claude, Codex, Gemini, OpenCode) provide candidates by researching the public web using their own search tools. Research must be limited to permitted public business sources. It must not bypass robots.txt, paywalls, authentication, CAPTCHAs, rate limits, or website restrictions.
