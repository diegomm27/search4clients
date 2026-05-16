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
