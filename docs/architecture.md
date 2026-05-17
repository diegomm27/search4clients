# Architecture

search4clients is a local-first, agent-native B2B client research workspace.

The primary interface is a command-based agent workflow. The user edits `config/search.request.json`, then runs `/search4clients scan` from an agent CLI or `npm run scan` directly. The Next.js app is a review dashboard for people who prefer a visual workflow.

## Product Flow

1. User describes the clients they want.
2. Agent validates or updates `config/search.request.json`.
3. Agent runs `npm run scan`.
4. Search provider returns candidate companies.
5. Evaluation scores each candidate with explainable reasons.
6. Leads, sources, and score explanations are saved to SQLite.
7. User receives HTML/CSV/Markdown/JSON exports or reviews in the dashboard.
8. User approves, rejects, exports, or drafts outreach manually.

## Boundaries

- `scripts/`: agent-friendly CLI commands.
- `config/search.request.example.json`: template for the local request file.
- `lib/search/`: search schemas, provider mode, and orchestration.
- `lib/evaluate/`: candidate evaluation.
- `lib/scoring/`: scoring dimensions and grade assignment.
- `lib/ai/`: AI provider abstraction for manual outreach drafts.
- `lib/export/`: CSV and Markdown exporters.
- `lib/storage/`: Prisma client and JSON helpers.
- `app/`: local Next.js dashboard.
- `components/`: dashboard UI components.
- `prisma/`: SQLite schema.

## Providers

The built-in demo provider is the only implemented search provider. It returns deterministic sample public-business data and must be labeled as demo data in user-facing surfaces.

Future search providers must be explicit, opt-in, and limited to permitted public business sources. They must not bypass robots.txt, paywalls, authentication, CAPTCHAs, rate limits, or website restrictions.

AI provider settings are separate from search behavior and are stored locally through the Settings page. AI providers may generate draft outreach text after a lead is approved, but they must never send outreach.

## Data Storage

SQLite is the default local store. Prisma owns schema access. User data should remain local unless a future user explicitly configures an external store.

## Review UI

The dashboard should stay simple:

- Home
- Find clients
- Potential clients
- Settings

Lead results should default to cards, not dense CRM tables. Advanced technical data can exist, but should be collapsed by default.
