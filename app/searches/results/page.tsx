import Link from "next/link";
import { prisma } from "@/lib/storage/prisma";
import { LeadTable } from "@/components/lead-table";

export const dynamic = "force-dynamic";

export default async function SearchResultsPage({ searchParams }: { searchParams: { id?: string } }) {
  const id = Number(searchParams.id);
  const search = Number.isFinite(id)
    ? await prisma.search.findUnique({ where: { id }, include: { leads: { orderBy: { score: "desc" } } } })
    : null;

  if (!search) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Search not found</h1>
        <Link href="/searches/new" className="text-pine hover:underline">Start a new search</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{search.name}</h1>
          <p className="mt-2 text-sm text-moss">{search.industry} in {[search.city, search.country].filter(Boolean).join(", ")} · {search.status}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/api/export?format=csv&searchId=${search.id}`} className="focus-ring rounded-md border border-line px-3 py-2 text-sm hover:bg-paper">CSV</Link>
          <Link href={`/api/export?format=markdown&searchId=${search.id}`} className="focus-ring rounded-md border border-line px-3 py-2 text-sm hover:bg-paper">Markdown</Link>
          <Link href={`/api/export?format=json&searchId=${search.id}`} className="focus-ring rounded-md border border-line px-3 py-2 text-sm hover:bg-paper">JSON</Link>
        </div>
      </div>
      <LeadTable leads={search.leads} />
    </div>
  );
}
