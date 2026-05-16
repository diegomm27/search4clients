import Link from "next/link";
import type { Lead } from "@prisma/client";
import { Badge } from "./ui";

export function LeadTable({ leads }: { leads: Lead[] }) {
  if (!leads.length) {
    return <p className="rounded-lg border border-line bg-white p-6 text-sm text-moss">No leads yet. Start a guided search to create the first batch.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-line bg-paper text-xs uppercase text-moss">
          <tr>
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Industry</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-line last:border-0">
              <td className="px-4 py-4">
                <Link href={`/leads/${lead.id}`} className="font-medium text-pine hover:underline">
                  {lead.company_name}
                </Link>
                <p className="mt-1 line-clamp-2 text-xs text-moss">{lead.reason_for_fit}</p>
              </td>
              <td className="px-4 py-4">{[lead.city, lead.country].filter(Boolean).join(", ") || "Unavailable"}</td>
              <td className="px-4 py-4">{lead.industry || "Unavailable"}</td>
              <td className="px-4 py-4">
                <div className="font-semibold">{lead.score}</div>
                <Badge tone={lead.fit_grade === "A" || lead.fit_grade === "B" ? "good" : "warn"}>{lead.fit_grade}</Badge>
              </td>
              <td className="px-4 py-4 text-xs text-moss">
                {lead.public_email || lead.public_phone || lead.contact_page ? "Public channel found" : "Missing"}
              </td>
              <td className="px-4 py-4">
                <Badge>{lead.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
