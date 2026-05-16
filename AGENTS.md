# AGENTS.md

## Project

search4clients is an open-source, local-first AI research tool for finding potential B2B clients in a specific country, region, city, or market.

It helps freelancers, agencies, consultants, sales teams, and B2B founders define a target client profile, search public sources for matching companies, evaluate and score each company, and organize results into a structured lead tracker.

search4clients is **not** a spam or mass outreach tool. It must remain human-in-the-loop.

---

## Core principles

1. **Human-in-the-loop**
   - AI can research, evaluate, score, enrich, and draft.
   - Users must review and approve decisions.
   - Never automatically send emails, messages, LinkedIn requests, or outreach.

2. **Public data only**
   - Collect only publicly available business information.
   - Prefer company-level data over personal data.
   - Do not scrape private, gated, sensitive, or restricted sources.
   - Do not bypass auth, paywalls, CAPTCHAs, rate limits, or platform restrictions.

3. **No hallucinated data**
   - Never invent companies, emails, phone numbers, websites, social profiles, or source links.
   - Unknown fields must be `null`, `[]`, or clearly marked unavailable.
   - Separate factual observations from AI interpretation.

4. **Source transparency**
   - Include source links whenever possible.
   - Show why each lead was scored the way it was.
   - Lower confidence when evidence is weak or incomplete.

5. **Local-first**
   - Store user data locally by default.
   - Use SQLite or equivalent local storage unless explicitly configured otherwise.
   - Support portable exports such as CSV, JSON, and Markdown.

---

## Main workflow

1. User starts a new client search.
2. AI/tool asks clarifying questions if criteria are incomplete.
3. User confirms the search configuration.
4. App searches permitted public sources.
5. AI evaluates and scores candidate companies.
6. Leads are saved to the local tracker.
7. User reviews, filters, approves, rejects, enriches, exports, or drafts outreach manually.

---

## Guided search questions

Before running a search, ask only missing relevant questions, such as:

- Country, city, region, or province
- Target industry or business type
- Service/product the user sells
- Ideal client profile
- Positive buying signals
- Disqualifying signals
- Number of leads desired
- Whether public phone numbers should be collected
- Whether public emails should be collected
- Whether websites, contact pages, LinkedIn, or social profiles should be collected
- Whether source links and outreach angles should be included
- Preferred output/export format

Do not ask questions already answered by the user.

---

## Lead model

A lead should support these fields where available:

- `id`
- `search_id`
- `company_name`
- `country`
- `region`
- `city`
- `industry`
- `business_category`
- `website`
- `contact_page`
- `public_email`
- `public_phone`
- `linkedin_company_page`
- `social_profiles`
- `company_description`
- `score`
- `fit_grade`
- `contactability_score`
- `confidence_score`
- `reason_for_fit`
- `visible_opportunities`
- `suggested_offer`
- `suggested_outreach_angle`
- `sources`
- `status`
- `notes`
- `created_at`
- `updated_at`

Use `null` for unavailable scalar values and `[]` for unavailable lists.

---

## Search model

A search should support:

- `id`
- `name`
- `country`
- `region`
- `city`
- `language`
- `industry`
- `service_offered`
- `target_client_type`
- `ideal_client_signals`
- `exclude_signals`
- `desired_public_data`
- `number_of_results`
- `minimum_score`
- `status`
- `created_at`
- `updated_at`

---

## Lead statuses

Supported statuses:

- `new`
- `reviewed`
- `approved`
- `rejected`
- `contacted`
- `replied`
- `meeting_booked`
- `client_won`
- `client_lost`
- `do_not_contact`

Avoid adding statuses unless clearly needed.

---

## Scoring rules

Lead scoring must be explainable.

Score using:

- ICP fit
- Problem visibility
- Contactability
- Business legitimacy
- Commercial potential
- Personalization potential
- Confidence

Grades:

- `A`: Excellent lead
- `B`: Good lead
- `C`: Possible lead, needs validation
- `D`: Weak lead
- `F`: Not a fit

Every score must include a concise explanation.

---

## AI behavior

AI features must:

- Ask clarifying questions before search execution when needed.
- Convert user input into validated structured configs.
- Return schema-valid JSON for stored data.
- Never invent facts, sources, emails, phone numbers, or companies.
- Mark unknown values as unavailable.
- Separate factual observations from interpretation.
- Lower confidence when evidence is weak.
- Generate outreach only when requested.
- Clearly label outreach as AI-generated draft content.
- Never send outreach automatically.

---

## Privacy and compliance

Required behavior:

- Use only public business information.
- Avoid unnecessary personal data.
- Respect website terms and robots.txt where applicable.
- Do not bypass anti-bot protections.
- Do not automate mass outreach.
- Allow users to delete leads and search history.
- Clearly disclose what data is sent to AI providers.
- Store API keys securely.
- Never log full API keys.
- Never expose secrets client-side.

---

## Suggested stack

Preferred stack:

- TypeScript
- Node.js
- Next.js
- SQLite
- Prisma or Drizzle
- Zod
- Tailwind CSS
- Playwright where appropriate
- AI provider abstraction
- CSV/JSON/Markdown exports

Keep modules small and maintainable.

---

## Suggested structure

```text
app/
components/
config/
db/
docs/
lib/
  ai/
  enrich/
  evaluate/
  export/
  privacy/
  prompts/
  scoring/
  search/
  storage/
scripts/
tests/
README.md
AGENTS.md
.env.example
package.json