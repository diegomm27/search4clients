import { prisma } from "@/lib/storage/prisma";
import { LeadTable } from "@/components/lead-table";
import { leadStatuses } from "@/lib/search/schemas";

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
        <h1 className="text-3xl font-semibold">Lead tracker</h1>
        <p className="mt-2 text-sm text-moss">Filter, review, approve, reject, export, and open lead details.</p>
      </div>
      <form className="grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-4">
        <select name="status" defaultValue={searchParams.status || ""} className="focus-ring rounded-md border border-line px-3 py-2 text-sm">
          <option value="">Any status</option>
          {leadStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select name="grade" defaultValue={searchParams.grade || ""} className="focus-ring rounded-md border border-line px-3 py-2 text-sm">
          <option value="">Any grade</option>
          {["A", "B", "C", "D", "F"].map((grade) => <option key={grade} value={grade}>{grade}</option>)}
        </select>
        <input name="minScore" type="number" min="0" max="100" defaultValue={searchParams.minScore || ""} placeholder="Minimum score" className="focus-ring rounded-md border border-line px-3 py-2 text-sm" />
        <button className="focus-ring rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-ink">Apply filters</button>
      </form>
      <LeadTable leads={leads} />
    </div>
  );
}
