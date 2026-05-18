import { prisma } from "@/lib/storage/prisma";
import { LeadCardGrid } from "@/components/lead-card";
import { visibleLeadStatuses } from "@/lib/leads/status";

export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }: { searchParams: { status?: string; grade?: string; minScore?: string } }) {
  const minScore = searchParams.minScore ? Number(searchParams.minScore) : undefined;
  const leads = await prisma.lead.findMany({
    where: {
      status: searchParams.status || undefined,
      fit_grade: searchParams.grade || undefined,
      score: Number.isFinite(minScore) ? { gte: minScore } : undefined
    },
    orderBy: [{ score: "desc" }, { created_at: "desc" }]
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Potential clients</h1>
        <p className="mt-2 text-sm text-moss">Review each company, then mark it as a good fit or not a fit.</p>
      </div>
      <form className="grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-4">
        <select name="status" defaultValue={searchParams.status || ""} className="focus-ring rounded-md border border-line px-3 py-2 text-sm">
          <option value="">Any status</option>
          {visibleLeadStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
        </select>
        <select name="grade" defaultValue={searchParams.grade || ""} className="focus-ring rounded-md border border-line px-3 py-2 text-sm">
          <option value="">Any grade</option>
          {["A", "B", "C", "D", "F"].map((grade) => <option key={grade} value={grade}>{grade}</option>)}
        </select>
        <input name="minScore" type="number" min="0" max="100" defaultValue={searchParams.minScore || ""} placeholder="Minimum score" className="focus-ring rounded-md border border-line px-3 py-2 text-sm" />
        <button className="focus-ring rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-ink">Apply filters</button>
      </form>
      <LeadCardGrid leads={leads} />
    </div>
  );
}
