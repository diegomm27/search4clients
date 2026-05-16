import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/storage/prisma";
import { Badge, Card, Select, Textarea } from "@/components/ui";
import { leadStatuses } from "@/lib/search/schemas";
import { decodeJson } from "@/lib/storage/json";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { id: Number(params.id) },
    include: { source_records: true, outreach_drafts: { orderBy: { created_at: "desc" } } }
  });
  if (!lead) notFound();

  const scoreExplanation = decodeJson<Array<{ dimension: string; score: number; reason: string }>>(lead.score_explanation, []);
  const opportunities = decodeJson<string[]>(lead.visible_opportunities, []);
  const sources = decodeJson<string[]>(lead.sources, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{lead.company_name}</h1>
          <p className="mt-2 text-sm text-moss">{[lead.city, lead.region, lead.country].filter(Boolean).join(", ")} · {lead.industry}</p>
        </div>
        <div className="flex gap-2">
          <Badge tone={lead.fit_grade === "A" || lead.fit_grade === "B" ? "good" : "warn"}>{lead.fit_grade}</Badge>
          <Badge>{lead.status}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-lg font-semibold">AI reasoning</h2>
          <p className="mt-3 text-sm leading-6 text-moss">{lead.reason_for_fit}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div><p className="text-xs text-moss">Fit score</p><p className="text-2xl font-semibold">{lead.score}</p></div>
            <div><p className="text-xs text-moss">Contactability</p><p className="text-2xl font-semibold">{lead.contactability_score}</p></div>
            <div><p className="text-xs text-moss">Confidence</p><p className="text-2xl font-semibold">{lead.confidence_score}</p></div>
          </div>
          <h3 className="mt-6 font-semibold">Score breakdown</h3>
          <div className="mt-3 space-y-3">
            {scoreExplanation.map((item) => (
              <div key={item.dimension} className="rounded-md border border-line p-3">
                <div className="flex justify-between gap-3 text-sm font-medium"><span>{item.dimension}</span><span>{item.score}</span></div>
                <p className="mt-1 text-xs text-moss">{item.reason}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Review controls</h2>
          <form action={`/api/leads/${lead.id}`} method="post" className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Status</span>
              <Select name="status" defaultValue={lead.status}>
                {leadStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </Select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Notes</span>
              <Textarea name="notes" defaultValue={lead.notes} />
            </label>
            <button className="focus-ring rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-ink">Save lead</button>
          </form>
          <form action={`/api/leads/${lead.id}`} method="post" className="mt-4 border-t border-line pt-4">
            <input type="hidden" name="intent" value="delete" />
            <button className="focus-ring rounded-md border border-rust px-4 py-2 text-sm font-medium text-rust hover:bg-paper">Delete lead</button>
          </form>
          <form action={`/api/leads/${lead.id}/outreach`} method="post" className="mt-4">
            <button disabled={lead.status !== "approved"} className="focus-ring rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-paper disabled:opacity-50">Generate outreach draft</button>
            {lead.status !== "approved" && <p className="mt-2 text-xs text-moss">Approve the lead before drafting outreach.</p>}
          </form>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold">Public contact data</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-moss">Website</dt><dd>{lead.website ? <Link className="text-pine hover:underline" href={lead.website}>{lead.website}</Link> : "Unavailable"}</dd></div>
            <div><dt className="text-moss">Contact page</dt><dd>{lead.contact_page || "Unavailable"}</dd></div>
            <div><dt className="text-moss">Email</dt><dd>{lead.public_email || "Unavailable"}</dd></div>
            <div><dt className="text-moss">Phone</dt><dd>{lead.public_phone || "Unavailable"}</dd></div>
          </dl>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Opportunities</h2>
          <ul className="mt-3 space-y-2 text-sm text-moss">{opportunities.map((item) => <li key={item}>{item}</li>)}</ul>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Sources</h2>
          <ul className="mt-3 space-y-2 text-sm text-moss">{sources.map((source) => <li key={source}>{source}</li>)}</ul>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Outreach drafts</h2>
        <div className="mt-3 space-y-4">
          {lead.outreach_drafts.length ? lead.outreach_drafts.map((draft) => (
            <div key={draft.id} className="rounded-md border border-line p-4">
              <p className="font-medium">{draft.subject}</p>
              <pre className="mt-3 whitespace-pre-wrap text-sm text-moss">{draft.body}</pre>
            </div>
          )) : <p className="text-sm text-moss">No drafts generated yet.</p>}
        </div>
      </Card>
    </div>
  );
}
