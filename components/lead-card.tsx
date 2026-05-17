import Link from "next/link";
import type { Lead } from "@prisma/client";
import { Badge } from "./ui";
import { fitLabel, leadStatusLabel } from "@/lib/leads/status";

function locationFor(lead: Lead) {
  return [lead.city, lead.country].filter(Boolean).join(", ") || "Location unavailable";
}

function hasPublicContact(lead: Lead) {
  return Boolean(lead.public_email || lead.public_phone || lead.contact_page || lead.website);
}

export function LeadCard({ lead }: { lead: Lead }) {
  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-ink">{lead.company_name}</h3>
          <p className="mt-1 text-sm text-moss">
            {locationFor(lead)} - {lead.industry || "Industry unavailable"}
          </p>
        </div>
        <Badge>{leadStatusLabel(lead.status)}</Badge>
      </div>

      <p className="mt-4 text-sm font-medium">
        Score: {lead.score} - {fitLabel(lead.score)}
      </p>

      <div className="mt-4">
        <p className="text-sm font-medium">Why this lead</p>
        <p className="mt-1 line-clamp-3 text-sm leading-6 text-moss">{lead.reason_for_fit}</p>
      </div>

      <p className="mt-4 text-sm">
        <span className="font-medium">Contact: </span>
        <span className="text-moss">{hasPublicContact(lead) ? "Public channel found" : "No public channel found"}</span>
      </p>

      <Link
        href={`/leads/${lead.id}`}
        className="focus-ring mt-5 inline-flex rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-ink"
      >
        Review
      </Link>
    </article>
  );
}

export function LeadCardGrid({ leads, emptyText = "No potential clients yet. Find clients to create the first batch." }: { leads: Lead[]; emptyText?: string }) {
  if (!leads.length) {
    return <p className="rounded-lg border border-line bg-white p-6 text-sm text-moss">{emptyText}</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
    </div>
  );
}
