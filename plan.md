# search4clients — Product Plan

**Positioning:** the sell-side mirror of career-ops. An agent-first, multi-CLI command center that turns any AI coding CLI into a client-prospecting engine — it *enumerates* a market (not samples it), scores fit, and exports a reviewable lead list. Git-clone, run, own your data.

**Scanning policy (locked):** ToS-compliant Playwright navigation is allowed. The agent may navigate and paginate public directories that permit it. It may **not** bypass CAPTCHAs, paywalls, auth/login walls, robots.txt, or rate limits; may not rotate proxies or spoof fingerprints; uses the Google **Places API** rather than scraping Google Maps.

---

## Architecture

Agent-first, like career-ops — the CLI is the engine. The npm/TS layer provides deterministic tooling the agent drives.

```text
search.request.json ──▶ /search4clients scan
                              │   agent picks sources from config/sources.json
                              ▼
                    ┌──── Directory Scanner ────┐
                    │ overpass (api, free)      │
                    │ google-places (api, key)  │  systematic pagination,
                    │ directory (browser/PW)    │  stop conditions
                    └────────────┬──────────────┘
                                 ▼
              dedup / entity-resolution  ──▶  config/candidates.json
                                 ▼
                          enrich (site fetch, signals)
                                 ▼
                    score (evaluate.ts / scoring.ts — exists)
                                 ▼
            export + coverage report (HTML/CSV/MD/JSON — exists)
```

---

## Repo structure

```text
search4clients/
├── AGENTS.md                  ✅ canonical instructions (rewritten)
├── CLAUDE.md                  ✅ thin Claude Code wrapper
├── GEMINI.md                  ⬜ thin Gemini CLI wrapper
├── .gemini/commands/*.toml    ⬜ Gemini CLI command defs
├── .markdownlint.json         ✅ markdown linting config
├── config/
│   ├── search.request.json    ✅ exists
│   ├── sources.json           ✅ NEW — directory registry
│   ├── taxonomy.json          ✅ NEW — 30 categories, 70 country ISO codes
│   └── candidates.json        produced by npm run scan
├── modes/                     ⬜ NEW — focused skill modes
│   ├── _shared.md
│   ├── scan.md
│   ├── enrich.md
│   ├── score.md
│   ├── export.md
│   └── batch.md
├── lib/
│   ├── scan/                  🔄 IN PROGRESS
│   │   ├── types.ts           ✅ RawRecord, ScanProvider, ProviderRequest
│   │   ├── sources.ts         ✅ parse + validate sources.json
│   │   ├── scanner.ts         ⬜ orchestrator
│   │   └── providers/
│   │       ├── overpass.ts    ⬜ OSM Overpass provider
│   │       ├── places.ts      ⬜ Google Places provider
│   │       └── directory.ts   ⬜ generic Playwright paginator
│   ├── dedup/                 ⬜ NEW — entity resolution
│   ├── coverage/              ⬜ NEW — coverage report
│   ├── enrich/                ⬜ NEW — site fetch, signal detection
│   ├── evaluate/              ✅ exists
│   ├── scoring/               ✅ exists
│   ├── search/                ✅ exists
│   └── export/                ✅ exists
├── scripts/
│   ├── scan.ts                ⬜ NEW — full automated pipeline
│   ├── search.ts              ✅ exists (renamed role: score pre-existing candidates.json)
│   ├── doctor.ts              ⬜ update — check Playwright + .env keys
│   ├── leads.ts               ✅ exists
│   └── export.ts              ✅ exists
├── .env.example               ⬜ NEW
├── cache/                     ⬜ NEW — hashed raw responses, offline re-runs
├── examples/                  ⬜ NEW — ready-to-run request files
└── tests/                     ⬜ NEW
```

Legend: ✅ done · 🔄 in progress · ⬜ pending

---

## Phases

### Phase 0 — Foundation & policy rewrite ✅ COMPLETE

- [x] Rewrote `AGENTS.md` with the locked scanning policy, multi-CLI support table, mode commands, and updated flow.
- [x] Updated `CLAUDE.md` to thin wrapper.
- [x] Added `.markdownlint.json` to configure markdown linting.
- [x] Defined shared types: `RawRecord`, `ScanProvider`, `ProviderRequest`, `ScanOptions` in `lib/scan/types.ts`.
- [x] Created `lib/scan/sources.ts` — loads and filters `config/sources.json`.

**Done:** policy is unambiguous and types compile.

---

### Phase 1 — The Directory Scanner (completeness engine) ✅ COMPLETE

- [x] `config/sources.json` — ships with: `osm-overpass` (free, global), `google-places` (key, global), and four disabled templates (ES, DE, UK, FR) with selectors and notes.
- [x] `config/taxonomy.json` — 30 business categories, 70 country ISO codes, OSM tags + Places types per category.
- [x] `lib/scan/types.ts` — provider interface and shared types.
- [x] `lib/scan/sources.ts` — source loading and filtering.
- [x] `lib/scan/providers/overpass.ts` — Overpass QL queries with admin-region filtering, caching.
- [x] `lib/scan/providers/places.ts` — Google Places Text Search, paginated, cached.
- [x] `lib/scan/providers/directory.ts` — generic Playwright paginator driven by `sources.json` selectors.
- [x] `lib/scan/scanner.ts` — orchestrator: taxonomy match → run providers → dedup → convert to `CandidateCompany[]`.
- [x] `scripts/scan.ts` — new entry point: enumerate → score → export.
- [x] Update `package.json` scripts: `scan` → `scripts/scan.ts`, add `score` → `scripts/search.ts`.
- [x] Update `scripts/doctor.ts` — check Playwright, `.env` keys, `sources.json`, `taxonomy.json`.
- [x] `.env.example`

**Done when:** `git clone` → `npm install` → `npm run scan` returns hundreds of real businesses for a storefront category with zero API key (via Overpass alone).

---

### Phase 2 — Multi-CLI + mode structure ⬜ PENDING

- [ ] `modes/_shared.md` — common context loaded by all modes.
- [ ] `modes/scan.md` — how the agent drives the scanner.
- [ ] `modes/enrich.md` — how the agent enriches candidates.
- [ ] `modes/score.md` — how the agent scores pre-existing candidates.
- [ ] `modes/export.md` — how the agent exports.
- [ ] `modes/batch.md` — how the agent runs parallel multi-region scans.
- [ ] `GEMINI.md` — thin Gemini CLI wrapper.
- [ ] `.gemini/commands/search4clients.toml` — Gemini CLI command definitions.

**Done when:** identical flow runs under Claude Code and Gemini CLI.

---

### Phase 3 — Batch + enrichment ⬜ PENDING

- [ ] Batch mode: parallel sub-agent workers scan multiple regions/categories.
- [ ] Enrich mode: fetch company sites for email/phone/contact page; detect `observed_signals`.
- [ ] `lib/enrich/` — site fetch, signal detection.

**Done when:** a batch run enriches and scores a multi-region list end-to-end.

---

### Phase 4 — Dedup, coverage, pipeline integrity ⬜ PENDING

- [ ] `lib/dedup/` — entity resolution (name + geo + phone + domain).
- [ ] `lib/coverage/` — capture-recapture coverage estimate, reported in every export.
- [ ] Lead status lifecycle: new → contacted → qualified → dropped.

**Done when:** re-running a request is idempotent and the export shows a coverage figure.

---

### Phase 5 — Open-source polish ⬜ PENDING

- [ ] `README` with hero banner, demo GIF, headline metric, 60-second quickstart.
- [ ] Multi-language READMEs, `MIT LICENSE`, `TRADEMARK.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`.
- [ ] Tests (vitest) + GitHub Actions CI.
- [ ] `examples/` with ready-to-run request files.
- [ ] "Adding a directory source" guide.

**Done when:** a stranger can clone, run, and contribute a source without asking a question.

---

### Phase 6 — Dashboard TUI ⬜ PENDING (optional)

Go terminal dashboard to browse, filter, and sort the lead pipeline. Implement last.

---

## Ethics & legal guardrails (carried in AGENTS.md)

- Real companies only — never invent companies, contacts, emails, or sources.
- Public, company-level data only; no personal data harvesting.
- Honor robots.txt, ToS, rate limits, paywalls, auth, CAPTCHAs — no bypass of any kind.
- No proxy rotation, fingerprint spoofing, or rate-limit evasion.
- Google data via Places API only — never scrape Google Maps.
- OSM exports must carry "© OpenStreetMap contributors" (ODbL attribution).
- Never send outreach — human-in-the-loop always; the user acts, the agent recommends.

---

## Sequencing

| Phase | Depends on | Can overlap with |
| --- | --- | --- |
| 0 — Foundation | — | — |
| 1 — Scanner | 0 | — |
| 2 — Multi-CLI | 1 (tail) | 1 |
| 3 — Batch + enrich | 1 | 4 |
| 4 — Dedup + coverage | 1 | 3 |
| 5 — OSS polish | 1 | 3, 4 |
| 6 — Dashboard TUI | 5 | — |
