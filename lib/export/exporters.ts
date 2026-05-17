import type { Lead } from "@prisma/client";

const fields: Array<keyof Lead> = [
  "company_name",
  "country",
  "region",
  "city",
  "industry",
  "business_category",
  "website",
  "contact_page",
  "public_email",
  "public_phone",
  "linkedin_company_page",
  "score",
  "fit_grade",
  "contactability_score",
  "confidence_score",
  "status",
  "reason_for_fit",
  "suggested_offer",
  "suggested_outreach_angle",
  "notes",
  "created_at",
  "updated_at"
];

function cell(value: unknown) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function leadsToCsv(leads: Lead[]) {
  const rows = [fields.join(",")];
  for (const lead of leads) {
    rows.push(fields.map((field) => `"${cell(lead[field]).replace(/"/g, '""')}"`).join(","));
  }
  return rows.join("\n");
}

export function leadsToMarkdown(leads: Lead[]) {
  const header = "| Company | Location | Score | Grade | Status | Reason |\n|---|---|---:|:---:|---|---|";
  const rows = leads.map((lead) =>
    `| ${lead.company_name} | ${[lead.city, lead.country].filter(Boolean).join(", ")} | ${lead.score} | ${lead.fit_grade} | ${lead.status} | ${lead.reason_for_fit.replace(/\|/g, "/")} |`
  );
  return [header, ...rows].join("\n");
}

function escapeHtml(value: unknown) {
  return cell(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function leadsToHtml(leads: Lead[]) {
  const rows = leads.map((lead) => `
      <article class="lead">
        <div class="lead-header">
          <div>
            <h2>${escapeHtml(lead.company_name)}</h2>
            <p>${escapeHtml([lead.city, lead.country].filter(Boolean).join(", ") || "Location unavailable")} - ${escapeHtml(lead.industry || "Industry unavailable")}</p>
          </div>
          <strong>Score ${escapeHtml(lead.score)}</strong>
        </div>
        <p>${escapeHtml(lead.reason_for_fit)}</p>
        <dl>
          <div><dt>Website</dt><dd>${lead.website ? `<a href="${escapeHtml(lead.website)}">${escapeHtml(lead.website)}</a>` : "Unavailable"}</dd></div>
          <div><dt>Contact page</dt><dd>${escapeHtml(lead.contact_page || "Unavailable")}</dd></div>
          <div><dt>Public email</dt><dd>${escapeHtml(lead.public_email || "Unavailable")}</dd></div>
          <div><dt>Public phone</dt><dd>${escapeHtml(lead.public_phone || "Unavailable")}</dd></div>
          <div><dt>Status</dt><dd>${escapeHtml(lead.status)}</dd></div>
        </dl>
      </article>`).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>search4clients leads</title>
  <style>
    body { margin: 0; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f7f8f5; color: #17211f; }
    main { max-width: 960px; margin: 0 auto; padding: 32px 20px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    .meta { color: #64796b; margin: 0 0 24px; }
    .lead { border: 1px solid #dfe5df; border-radius: 8px; background: white; padding: 20px; margin-bottom: 16px; }
    .lead-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
    h2 { margin: 0; font-size: 20px; }
    .lead-header p { margin: 4px 0 0; color: #64796b; }
    dl { display: grid; gap: 8px; margin: 16px 0 0; }
    dt { font-weight: 600; }
    dd { margin: 2px 0 0; color: #64796b; }
    a { color: #20483c; }
  </style>
</head>
<body>
  <main>
    <h1>Potential clients</h1>
    <p class="meta">${leads.length} leads exported from search4clients. Review before taking action.</p>
    ${rows || "<p>No leads found.</p>"}
  </main>
</body>
</html>`;
}
