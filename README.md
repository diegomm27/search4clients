# search4clients

search4clients is an open-source, local-first AI research assistant for finding better potential B2B clients. It helps freelancers, agencies, consultants, sales teams, and founders define a target client profile, search permitted public sources, score companies transparently, and review leads before taking action.

It is **not** a mass outreach tool. It does not send emails, LinkedIn messages, or automated contact requests.

## Who it is for

- Freelancers looking for local businesses that match a service offer.
- Agencies researching verticals, cities, or markets.
- Consultants validating a target account profile.
- B2B founders building a repeatable prospect research workflow.
- Sales teams that want structured, source-aware lead review.

## What it does

- Guides the user through a new client search.
- Converts answers into a structured search configuration.
- Stores searches and leads locally in SQLite.
- Scores leads using explainable dimensions.
- Tracks lead status, notes, source links, and AI reasoning.
- Exports leads to CSV, JSON, or Markdown.
- Generates optional AI-labeled outreach drafts for approved leads.

## What it does not do

- It does not automate mass outreach.
- It does not scrape private, gated, sensitive, or restricted data.
- It does not bypass authentication, paywalls, CAPTCHAs, robots.txt, or rate limits.
- It does not fabricate companies, emails, phone numbers, or source links.
- It does not recommend contacting leads without enough evidence.

## Stack

- TypeScript
- Next.js App Router
- Prisma
- SQLite
- Zod
- Tailwind CSS
- Provider abstraction for AI models

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/diegomm27/search4clients.git
cd search4clients
npm install

# 2. Configure local environment
cp .env.example .env

# 3. Create the local SQLite database
npm run db:push

# 4. Load example searches and leads
npm run db:seed

# 5. Start the dashboard
npm run dev
```

Open <http://localhost:3000>.

## Execution Guide

### Prerequisites

- Node.js 20 or newer.
- npm.
- A local terminal with permission to run Node and Prisma binaries.
- Optional: an AI API key. The MVP works with the mock provider when no key is configured.

### First local run

```bash
git clone https://github.com/diegomm27/search4clients.git
cd search4clients
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Open the dashboard:

```text
http://localhost:3000
```

### Windows PowerShell note

If PowerShell blocks `npm` with an execution policy error, use the `.cmd` shim:

```powershell
npm.cmd install
npm.cmd run db:push
npm.cmd run db:seed
npm.cmd run dev
```

### Environment variables

The default `.env` should look like this:

```bash
DATABASE_URL="file:./dev.db"
AI_PROVIDER="mock"
OPENAI_API_KEY=""
```

`DATABASE_URL="file:./dev.db"` creates `prisma/dev.db`. That file is local runtime data and is intentionally ignored by git.

### Development commands

```bash
npm run dev          # Start the Next.js dashboard at localhost:3000
npm run typecheck    # Run TypeScript checks
npm run build        # Build for production
npm run start        # Start the production build
npm run db:push      # Apply the Prisma schema to SQLite
npm run db:seed      # Reset demo data and seed example leads
```

### Production-style local run

```bash
npm install
cp .env.example .env
npm run db:push
npm run build
npm run start
```

### Reset local data

The seed script clears searches, leads, sources, and drafts before loading example data:

```bash
npm run db:seed
```

To start with an empty database, delete `prisma/dev.db` and run:

```bash
npm run db:push
```

### Common execution issues

- `DATABASE_URL not found`: create `.env` from `.env.example`.
- `spawn EPERM` on Windows: allow Node/Prisma binaries in your security tool or terminal policy.
- Port `3000` already in use: run `npm run dev -- -p 3001` and open <http://localhost:3001>.
- Prisma client missing: run `npm install` or `npx prisma generate`.

## Configure the AI API key

Go to `Settings` and choose a provider. The MVP includes a mock local provider so you can run the product without a networked AI service. API keys are used server-side and should not be exposed in client code.

You can also set:

```bash
OPENAI_API_KEY="..."
AI_PROVIDER="openai"
```

The provider interface lives in `lib/ai/provider.ts`, so additional providers can be added without rewriting the product workflow.

## Run a search

1. Open `New search`.
2. Enter the target country, industry, service offered, signals to look for, exclusion signals, result count, and minimum score.
3. Review the structured configuration on the confirmation page.
4. Run the search.
5. Review results in the dashboard or lead tracker.

The MVP uses a deterministic demo public-source adapter in `lib/search/demo-source.ts`. This keeps the app runnable locally and gives contributors a safe integration point for real permitted public search providers.

## Scoring

Each lead receives a transparent score from 0 to 100 and a grade:

- `A`: Excellent lead, highly relevant, clear pain point, easy to contact.
- `B`: Good lead, relevant and worth reviewing.
- `C`: Possible lead, needs manual validation.
- `D`: Weak lead.
- `F`: Not a fit.

The score is based on:

- ICP fit
- Problem visibility
- Contactability
- Business legitimacy
- Commercial potential
- Personalization potential
- Confidence

Every lead detail page shows the score breakdown and explanation.

## Privacy

search4clients is designed around privacy-conscious research:

- Use only publicly available business information.
- Prefer company-level data over personal data.
- Respect website terms and robots.txt where applicable.
- Avoid collecting unnecessary personal data.
- Require human review before outreach.
- Let users delete leads and search history through the local database.
- Clearly label outreach drafts as AI-generated.

## Export

Use the dashboard export links or call:

```text
/api/export?format=csv
/api/export?format=json
/api/export?format=markdown
```

You can scope exports to one search:

```text
/api/export?format=csv&searchId=1
```

## Project structure

```text
app/                 Next.js pages and API routes
components/          Reusable UI components
config/              Example search templates
docs/                Architecture and contributor notes
lib/ai/              AI provider abstraction and settings
lib/evaluate/        Lead evaluation logic
lib/export/          CSV and Markdown exporters
lib/privacy/         Privacy guidance
lib/prompts/         Prompt templates
lib/scoring/         Transparent scoring system
lib/search/          Guided search and discovery orchestration
lib/storage/         Prisma client
prisma/              SQLite schema
scripts/             Seed scripts
```

## Contribute

Good first contributions:

- Add a permitted public search provider adapter.
- Add Playwright-based website analysis that respects robots.txt and rate limits.
- Improve duplicate detection and merge workflows.
- Add CLI commands for `init`, `scan`, `evaluate`, `enrich`, `export`, `dedup`, and `dashboard`.
- Add tests for scoring, exports, and config validation.

Keep the product human-in-the-loop. Do not add automatic outreach sending.
