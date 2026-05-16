# Architecture

search4clients is a local-first Next.js application with a modular research pipeline.

## Pipeline

1. Guided search form collects the target market and buying signals.
2. Confirmation page validates the configuration with Zod.
3. Search orchestrator creates a `Search` record.
4. Discovery adapter returns public candidate companies.
5. Evaluation module scores each candidate with transparent dimensions.
6. Leads, sources, and score explanations are saved to SQLite through Prisma.
7. The dashboard lets users review, filter, approve, reject, export, or draft outreach.

## Adapter boundaries

- `lib/search`: discovery orchestration and search schemas.
- `lib/evaluate`: candidate evaluation.
- `lib/scoring`: transparent scoring system.
- `lib/ai`: provider abstraction and server-side settings.
- `lib/export`: CSV, JSON, and Markdown export helpers.
- `lib/privacy`: privacy and compliance copy.
- `lib/storage`: Prisma client.

The MVP includes a deterministic demo public-source adapter so the app works locally without scraping. Real discovery providers should respect robots.txt, terms of service, and rate limits.
