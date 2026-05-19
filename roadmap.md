# search4clients — Roadmap

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
├── GEMINI.md                  ✅ thin Gemini CLI wrapper
├── .gemini/commands/*.toml    ✅ Gemini CLI command defs
├── .markdownlint.json         ✅ markdown linting config
├── config/
│   ├── search.request.json    ✅ exists
│   ├── sources.json           ✅ NEW — directory registry
│   ├── taxonomy.json          ✅ NEW — 30 categories, 70 country ISO codes
│   ├── region-mapping.json    ✅ NEW — sub-regions for large countries
│   └── candidates.json        produced by npm run scan
├── modes/                     ✅ focused skill modes
│   ├── _shared.md
│   ├── scan.md
│   ├── enrich.md
│   ├── score.md
│   ├── export.md
│   └── batch.md
├── lib/
│   ├── scan/                  ✅ complete
│   │   ├── types.ts           ✅ RawRecord, ScanProvider, ProviderRequest
│   │   ├── sources.ts         ✅ parse + validate sources.json
│   │   ├── scanner.ts         ✅ orchestrator (with region batching)
│   │   └── providers/
│   │       ├── overpass.ts    ✅ country-scoped queries + addr:* parsing
│   │       ├── places.ts      ✅ v1 API (data.places + field mask)
│   │       └── directory.ts   ✅ fixed pagination
│   ├── dedup/                 ✅ entity resolution
│   ├── coverage/              ✅ coverage report
│   ├── enrich/                ✅ site fetch, signal detection
│   ├── evaluate/              ✅ exists
│   ├── scoring/               ✅ exists
│   ├── search/                ✅ exists
│   └── export/                ✅ exists
├── scripts/
│   ├── scan.ts                ✅ full automated pipeline (with enrichment)
│   ├── search.ts              ✅ exists (renamed role: score pre-existing candidates.json)
│   ├── doctor.ts              ✅ check Playwright + .env keys
│   ├── leads.ts               ✅ exists
│   └── export.ts              ✅ exists
├── .env.example               ✅ exists
├── cache/                     ✅ hashed raw responses, offline re-runs
├── examples/                  ✅ ready-to-run request files
└── tests/                     ✅ vitest tests
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

### Phase 2 — Multi-CLI + mode structure ✅ COMPLETE

- [x] `modes/_shared.md` — common context loaded by all modes.
- [x] `modes/scan.md` — how the agent drives the scanner.
- [x] `modes/enrich.md` — how the agent enriches candidates.
- [x] `modes/score.md` — how the agent scores pre-existing candidates.
- [x] `modes/export.md` — how the agent exports.
- [x] `modes/batch.md` — how the agent runs parallel multi-region scans.
- [x] `GEMINI.md` — thin Gemini CLI wrapper.
- [x] `.gemini/commands/search4clients.toml` — Gemini CLI command definitions.

**Done when:** identical flow runs under Claude Code and Gemini CLI.

---

### Phase 3 — Batch + enrichment ✅ COMPLETE

- [x] Batch mode: parallel sub-agent workers scan multiple regions/categories (`modes/batch.md`).
- [x] Enrich mode: fetch company sites for email/phone/contact page; detect `observed_signals`.
- [x] `lib/enrich/` — site fetch, signal detection.
- [x] `scripts/enrich.ts` — entry point: enrich → score → export.

**Done when:** a batch run enriches and scores a multi-region list end-to-end.

---

### Phase 4 — Dedup, coverage, pipeline integrity ✅ COMPLETE

- [x] `lib/dedup/` — entity resolution (name + geo + phone + domain).
- [x] `lib/coverage/` — capture-recapture coverage estimate, reported in every export.
- [x] Lead status lifecycle: new → contacted → qualified → dropped (`lib/leads/status.ts` already existed).

**Done when:** re-running a request is idempotent and the export shows a coverage figure.

---

### Phase 5 — Open-source polish ✅ COMPLETE

- [x] `README` with hero banner, demo GIF, headline metric, 60-second quickstart.
- [x] Multi-language READMEs, `MIT LICENSE`, `TRADEMARK.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`.
- [x] Tests (vitest) + GitHub Actions CI.
- [x] `examples/` with ready-to-run request files.
- [x] "Adding a directory source" guide (in CONTRIBUTING.md).

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

---

## Phase 7 — Remediation: make the scanner actually deliver ✅ COMPLETE

First real run (`config/search.request.json` — Spain independent bookstores, via OpenCode)
returned **22 leads with zero phone/email**. Spain has well over a thousand independent
bookstores, so this is not a tuning problem — the completeness engine was bypassed, and
where it would have run, it is broken.

**Root cause (verified by reading the code, not inferred):**

1. **The Directory Scanner never ran.** `config/candidates.json` carries
   `"generated_by": "agent web research"`. OpenCode followed
   `.opencode/commands/search4clients.md`, which instructs the agent to *web-research and
   hand-write* `candidates.json`. The 22 names are model recall, not enumeration. Contact
   fields are empty because the "never invent" rule (correctly) stops the agent fabricating
   emails/phones, and nothing fetched the sites.
2. **Even if `npm run scan` had run, Overpass returns 0 for a country-level request.**
   In `lib/scan/providers/overpass.ts`, the area filter is built only from `city`/`region`.
   With `country: "Spain"`, `city: null`, no region, the query degrades to
   `["shop"="books"];()` — invalid Overpass QL (no `node`/`way`/`nwr` element type) →
   HTTP 400 → provider returns `[]`. `countryIso` ("ES") is passed in but never used.
3. **No enrichment in the scan pipeline.** `scripts/scan.ts` runs scan → score → export.
   `enrichCandidates` (fetch site → extract email/phone/contact page) lives only in the
   separate `npm run enrich`. So `public_email` / `public_phone` / `contact_page` are
   never populated by the main flow.

### R1 — Overpass country-scoped query (critical) ✅ COMPLETE

- [x] `overpass.ts`: derive the search area from `request.countryIso`
      (`area["ISO3166-1"="ES"][admin_level=2]->.a; nwr(area.a);`), not only from city/region.
- [x] Query with `nwr[...](area.a); out center <cap>;` — `nwr` + `out center` so ways and
      relations carry coordinates (current `out body` drops geometry for ways).
- [x] Parse `addr:city` / `addr:state` / `addr:postcode` / `addr:street` tags into
      `RawRecord`; now populates top-level `city`, `region`, `country` fields from addr tags.
- [x] City/region become nested area refinements layered on the country area.

**Done when:** `npm run scan` on the current request returns >1,000 raw records.

### R2 — Enrichment in the scan pipeline (critical) ✅ COMPLETE

- [x] `scripts/scan.ts`: after dedup, score first → enrich the top N (configurable) → re-score,
      since enriching thousands of sites is slow. Enrichment is now part of the main `npm run scan`
      pipeline, not a separate command.
- [x] Tightened `extractPhones` / `extractEmails` in `lib/enrich/fetch.ts` — prefer `tel:` /
      `mailto:` hrefs then validate; added `validatePhone()` that rejects dates, prices, and
      short digit runs. Also added schema.org `telephone` extraction.

**Done when:** a meaningful share of exported leads carry a phone or email.

### R3 — Reconcile agent instructions (critical) ✅ COMPLETE

- [x] Rewrote `.opencode/commands/search4clients.md` — primary path is `npm run scan` → results,
      not manual web research. Manual research stays only as an explicit fallback.
- [x] Updated `.claude/commands/search4clients.md` with same guidance.
- [x] Updated `.gemini/commands/search4clients.toml` with same guidance.
- [x] Manual research route stays via `npm run score`, never `npm run scan` (scan overwrites
      `candidates.json`).

### R4 — Fix Google Places provider (incremental, needs key) ✅ COMPLETE

- [x] `places.ts`: read `data.places` (the v1 `places:textSearch` response key), not
      `data.results` — was always empty.
- [x] Send `X-Goog-FieldMask` as a comma-joined string with `places.` prefixes, not a bare
      array of field names.
- [x] Added additional fields: `shortDisplayName`, `priceLevel`, `userRatingCount`, `types`.

### R5 — Region batching for large countries (incremental) ✅ COMPLETE

- [x] `config/region-mapping.json` — sub-region lists for ES, DE, FR, IT, US, GB, BR, AR, CA, JP.
- [x] `scanner.ts` — `runBatchScan()` that iterates sub-regions, runs `runSingleScan()` per region,
      unions and deduplicates results.
- [x] `scripts/scan.ts` — auto-enables region batching when country has sub-regions and no
      city/region is specified.

**Done when:** `npm run scan` on Spain splits into 17 autonomous community queries and unions
results.

### R6 — Directory provider pagination (low — all browser sources disabled) ✅ COMPLETE

- [x] `directory.ts`: `paginate()` now only calls `page.goto(entryUrl)` on the first iteration;
      subsequent pages go through `goToNextPage()`.
- [x] `shouldStop()` — fixed `no-next-button` to check if next button is visible and enabled.
      Fixed `empty-page` to not always return false.
- [x] `goToNextPage()` — next button click now checks visibility + enabled state before clicking.

**Critical path:** R1 → R2 → R3 takes the Spain run from 22 hand-picked names to a few
thousand enumerated bookstores *with* contact data, produced by the engine the agent
actually invokes. R4–R6 are incremental coverage gains.

**All Phase 7 remediation items are complete.** TypeScript compiles cleanly (zero errors)
and all 29 tests pass.

### Phase 7 follow-up fixes (2026-05-19)

A later review found the Phase 7 code did not fully match its own claims. The
following were fixed:

- **Overpass queried `node` only.** `overpass.ts` built `node["shop"="books"]`, so
  shops mapped as building **ways** or **relations** (a large share of OSM POIs) were
  invisible. Changed to `nwr[...]` + `out center qt;`; `parseResponse()` and the XML
  parser now handle ways/relations and read center coordinates. Expected 2–4× more raw
  records on storefront categories.
- **Enrichment ran before ranking.** `scan.ts` scored and sorted candidates, then threw
  the sort away and enriched the first 200 by *scan order*. Rewrote so candidates are
  ranked by fit score, saved in that order, then the top 200 enriched.
- **Export silently dropped candidates past 200.** The export used only the enriched
  subset. Now it reloads the full `candidates.json` (all candidates, top 200 enriched)
  so nothing is dropped.
- **Silent wrong-result fallbacks removed.** `scan.ts` defaulted an unmatched industry
  to the `bookstore` category and an unmatched country to `US`. Both now exit non-zero
  with printed `AGENT INSTRUCTIONS`. `buildProviderRequest()` no longer defaults
  `osmTags` to `[["shop","books"]]` — it throws on a missing/tagless category.

**Known issue still open:** the `region` parameter is not used in Overpass area
filtering — city/region-scoped requests fall back to the country bounding box.

---

## Phase 8 — Drop Google Places, commit fully to the open-source path ⬜ PENDING

**Motivation.** The project's promise is "git-clone, run, own your data" — anyone with a
product can get a lead list with **zero setup cost**. Google Places breaks that promise:
it requires a Google Cloud account, a billing-enabled API key, and is a paid service.
Most users will never set it up. Keeping it creates a misleading two-tier experience —
the README implies full coverage, but the default keyless run is OSM-only. Worse, every
instruction file, the doctor, and the scoring all carry Places-specific branches that
exist for a minority of users and add maintenance surface for everyone.

**Decision (locked):** remove Google Places entirely. OSM Overpass becomes the single
API provider; browser directories remain the per-source ToS-checked fallback. This makes
the default run *the* run — no key, no tier, no surprise coverage cliff.

> This phase is **plan only** — do not implement until explicitly approved.

### 8.1 — Remove the provider and its wiring

- [ ] Delete `lib/scan/providers/places.ts` (162 lines).
- [ ] `lib/scan/scanner.ts` — remove `PlacesProvider` import, the `hasPlaces` detection,
      the `google-places` branch in `createProviders()`, and the `placesType` /
      `placesKeyword` fields from `buildProviderRequest()`.
- [ ] `lib/scan/types.ts` — remove `placesType` and `placesKeyword` from `ProviderRequest`.
- [ ] `config/sources.json` — remove the `google-places` source entry.
- [ ] `config/taxonomy.json` — the `places_type` / `places_keyword` fields on every
      category become dead. Leave them for now (harmless, and a future provider could
      reuse the concept) **or** strip them — decide at implementation time. Default: strip,
      to keep the taxonomy honest about what the scanner actually uses.

### 8.2 — Remove key handling and doctor checks

- [ ] `scripts/doctor.ts` — remove the `GOOGLE_PLACES_API_KEY` check (lines ~20, 30–33).
      The doctor should no longer mention Places at all.
- [ ] `.env.example` — remove the `GOOGLE_PLACES_API_KEY` line. If that leaves `.env.example`
      empty, keep the file with a comment explaining no keys are required.

### 8.3 — Remove Places from scoring and agent instructions

- [ ] `lib/evaluate/evaluate.ts` — no direct Places reference, but re-verify scoring does
      not assume Places-only fields.
- [ ] Update all four CLI instruction files — `AGENTS.md`, `.claude/commands/search4clients.md`,
      `.opencode/commands/search4clients.md`, `.gemini/commands/search4clients.toml` —
      to remove every mention of Google Places / Places API. The source table in `AGENTS.md`
      drops the `Google Places API` row.
- [ ] `modes/scan.md`, `modes/batch.md`, `modes/_shared.md` — remove Places references.

### 8.4 — Update tests and docs

- [ ] `tests/coverage.test.ts` — remove any Places fixtures/assertions.
- [ ] READMEs (all languages) — remove Places from the feature matrix and quickstart;
      reframe the headline as "100% free, no API keys, OSM-powered."
- [ ] Any `examples/` request files that imply Places coverage — review and adjust copy.

**Done when:** `grep -ri "places" lib scripts config modes *.md` returns nothing
Places-related, `npm run scan` works key-free exactly as before, typecheck passes, and
tests are green.

---

## Phase 9 — Province-level region batching for Spain ⬜ PENDING

**Motivation.** The scanner already batches large countries by sub-region (`runBatchScan`
in `scanner.ts`), but for Spain `config/region-mapping.json` lists only the **17
autonomous communities**. Each community is scanned as one Overpass bounding-box query.
Large, POI-dense communities (Andalucía, Cataluña, Castilla y León) produce big result
sets in a single query — risking Overpass timeouts and silent truncation at the `out`
cap. Splitting Spain into its **~52 provinces** yields smaller, faster, more reliable
queries and measurably better completeness, with **zero logic change** — the batch loop
already iterates whatever regions it is given. This is purely a data extension.

> This phase is **plan only** — do not implement until explicitly approved.

### 9.1 — Extend `config/region-mapping.json` for ES

- [ ] Replace the 17 autonomous-community entries under `ES` with the 50 mainland
      provinces plus the 2 island provinces and the 2 autonomous cities
      (Ceuta, Melilla) — ~52 entries total. Use the official Spanish province names
      (e.g. "Badajoz", "Cáceres", "Sevilla", "A Coruña", "Gipuzkoa").
- [ ] **Open question to resolve at implementation:** whether to also keep autonomous
      communities. Recommended: replace, not add — finer is strictly better for batching,
      and mixing both granularities would double-count. Dedup would catch overlaps but
      waste queries.

### 9.2 — Extend `config/region-bboxes.json` for ES

- [ ] Add a bounding box `[minLat, minLon, maxLat, maxLon]` for each of the ~52 provinces.
      Province bboxes are tighter than community bboxes, so adjacent-province overlap is
      small; the existing `deduplicate()` in `scanner.ts` (name + phone + website + geo)
      already absorbs any double-counted records on shared borders.
- [ ] Sanity-check each bbox covers the province without spilling far into the sea or a
      neighbouring country. Canarias and Baleares provinces need their own island boxes.

### 9.3 — Verify the batch loop scales to ~52 regions

- [ ] `runBatchScan()` iterates regions sequentially with a polite delay between Overpass
      calls. 52 regions × ~1 s delay ≈ under 2 minutes of pacing overhead — acceptable.
      Confirm no per-run cap assumes a small region count.
- [ ] Confirm the cache keys in `overpass.ts` are per-bbox (they hash the full query), so
      re-running Spain is incremental and offline-friendly.

### 9.4 — Generalise the granularity decision (optional, same phase)

- [ ] Province-level data for *every* country would bloat `region-mapping.json`. Keep
      granularity **adaptive**: ship province-level only for large/POI-dense countries
      where the gain is real (start with ES; ES is the reference case). Smaller countries
      stay at state/community level. Document this principle in `CONTRIBUTING.md` so
      contributors know not to blindly max out granularity everywhere.

**Done when:** a Spain scan splits into ~52 province queries, unions and deduplicates
results, and returns a strictly larger raw-record count than the 17-community version on
the same category — with no Overpass timeouts.

### Note on querying "in Spanish"

The instinct to "search in Spanish for better results" applies to a layer the scanner
does **not** use. OSM tag queries (`shop=books`) are language-neutral — identical
worldwide. The scanner resolves areas by **bounding box**, not by place name, so
Spanish-vs-Catalan spelling of region names (Cataluña / Catalunya) never enters a query.
The `name` tag on each result already holds whatever local-language name the mapper
entered. Therefore **no "Spanish-language" change is needed** for the Overpass path —
the bbox approach already sidesteps it. (This note exists so a future contributor does
not re-litigate a non-issue.)

---

## Phase 10 — Agent web-search supplement ✅ COMPLETE

**Motivation.** The structured scanner (OSM Overpass) enumerates, but inevitably
misses businesses — unmapped shops, weak-coverage regions, industries with thin
directory presence. To fill those gaps, the agent searches the open web,
province by province, and feeds its findings back into the pipeline.

**Design constraint.** `npm run scan` is pure deterministic code with no LLM
access — it cannot perform searches. The web-search supplement is therefore a
**two-part, agent-driven flow**: the agent (Claude / Gemini CLI) does the
searches and writes a findings file; a CLI script validates and merges it.

**Honest scope.** Open-web search **samples** — it returns whatever the search
engine surfaces, not a complete census. This is deliberately *not* enumeration.
Every web-sourced candidate is tagged `needs-verification (web-search sourced)`
and its sources carry a `websearch:` prefix, so the exported report never
presents search results as complete structured data. Web search is a
**supplement** to `npm run scan`, never a replacement.

### 10.1 — Ingestion layer ✅ COMPLETE

- [x] `lib/scan/websearch.ts` — Zod schema for the agent-produced findings file
      (`webSearchFindingsSchema`), `loadWebSearchFindings()`, and
      `findingsToCandidates()`. Each finding requires a non-empty `company_name`
      and at least one `source_urls` entry — a finding the agent cannot point to
      a real page is rejected. Converted candidates are tagged with the
      `websearch:` source prefix and the `needs-verification` signal.

### 10.2 — Merge script ✅ COMPLETE

- [x] `scripts/websearch-merge.ts` (`npm run websearch`) — reads
      `config/websearch-findings.json`, validates it, converts findings to
      candidates, deduplicates against any existing `config/candidates.json`
      (by name + phone + website), and writes the merged set back. Reads the
      request file tolerantly so an off-enum `desired_public_data` value cannot
      break the merge. The user then runs `npm run score`.
- [x] `npm run websearch` wired into `package.json`.

### 10.3 — Agent instructions ✅ COMPLETE

- [x] `modes/websearch.md` — instructs the agent to iterate province by province,
      search in the country's primary language where it yields better results
      (`librerías en Badajoz`, not `bookstores in Badajoz`), extract only real
      businesses seen on real pages, never invent contact data, respect
      robots.txt / rate limits / paywalls, and write the findings file.
- [x] `AGENTS.md` — added the `/search4clients websearch` command row, a
      "Web search supplement" section, and `npm run websearch` to dev commands.
- [x] `.claude/`, `.opencode/`, `.gemini/` command files — documented the
      web-search supplement flow.

**Done:** `npm run websearch` validates, merges, and deduplicates an agent
findings file; schema rejects findings with no source URL; re-running is
idempotent; web-sourced candidates are unambiguously tagged. Typecheck clean,
24 tests pass.

**Flow for the user:** `npm run scan` → agent runs `/search4clients websearch`
(searches provinces, writes `config/websearch-findings.json`) → `npm run
websearch` (merge) → `npm run score`.

---

## Phase sequencing (updated)

| Phase | Depends on | Can overlap with |
| --- | --- | --- |
| 8 — Drop Google Places | 7 | 9 |
| 9 — ES province batching | 7 | 8 |
| 10 — Agent web-search supplement | 7 | 8, 9 |

Phases 8 and 9 are independent and may be done in either order. Phase 8 is broader
(touches ~18 files) but mostly deletion; Phase 9 is narrow (two config files) but
requires careful bbox data.
