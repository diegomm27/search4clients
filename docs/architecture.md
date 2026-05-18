# Architecture

search4clients is a plug-and-play, command-based B2B client research workspace for AI coding agents.

The primary interface is `/search4clients scan` or `npm run scan`. The command reads `config/search.request.json` and writes files to `output/`. SQLite is not required for the primary agent workflow.

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
- `app/`, `prisma/`, and `lib/storage/`: optional local dashboard support.

## Candidate Sources

Agents (Claude, Codex, Gemini, OpenCode) provide candidates by researching the public web using their own search tools. Research must be limited to permitted public business sources. It must not bypass robots.txt, paywalls, authentication, CAPTCHAs, rate limits, or website restrictions.

## Optional Dashboard

The Next.js dashboard is secondary. It may use Prisma/SQLite internally, but it is not needed to run `/search4clients scan`.
