import Link from "next/link";
import { ArrowRight, CheckCircle2, FileDown, Search } from "lucide-react";
import { prisma } from "@/lib/storage/prisma";
import { Card } from "@/components/ui";
import { LeadTable } from "@/components/lead-table";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [leadCount, searchCount, approvedCount, recentLeads, searches] = await Promise.all([
    prisma.lead.count(),
    prisma.search.count(),
    prisma.lead.count({ where: { status: "approved" } }),
    prisma.lead.findMany({ orderBy: { created_at: "desc" }, take: 5 }),
    prisma.search.findMany({ orderBy: { created_at: "desc" }, take: 5, include: { leads: true } })
  ]);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-line bg-white p-8">
          <p className="mb-3 text-sm font-medium uppercase text-rust">Local-first prospecting research</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-ink">Find better potential clients with guided AI research and human review.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-moss">
            search4clients helps you define a target profile, discover public company data, score fit transparently, and organize leads without automating spam outreach.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/searches/new" className="focus-ring inline-flex items-center gap-2 rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-ink">
              <Search className="h-4 w-4" />
              Start guided search
            </Link>
            <Link href="/leads" className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-paper">
              Review leads
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <Card>
          <h2 className="text-lg font-semibold">What it will not do</h2>
          <ul className="mt-4 space-y-3 text-sm text-moss">
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-pine" /> No automatic emails or messages.</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-pine" /> No fabricated leads or guessed contacts.</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-pine" /> No gated, private, or restricted data.</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-pine" /> Outreach drafts require manual approval.</li>
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-moss">Saved searches</p><p className="mt-2 text-3xl font-semibold">{searchCount}</p></Card>
        <Card><p className="text-sm text-moss">Tracked leads</p><p className="mt-2 text-3xl font-semibold">{leadCount}</p></Card>
        <Card><p className="text-sm text-moss">Approved leads</p><p className="mt-2 text-3xl font-semibold">{approvedCount}</p></Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Search history</h2>
            <Link href="/api/export?format=json" className="text-sm text-pine hover:underline">
              <FileDown className="mr-1 inline h-4 w-4" />
              JSON
            </Link>
          </div>
          <div className="space-y-3">
            {searches.length ? searches.map((search) => (
              <Link key={search.id} href={`/searches/results?id=${search.id}`} className="block rounded-md border border-line p-3 hover:bg-paper">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{search.name}</span>
                  <span className="text-xs text-moss">{search.leads.length} leads</span>
                </div>
                <p className="mt-1 text-xs text-moss">{search.industry} in {search.country}</p>
              </Link>
            )) : <p className="text-sm text-moss">No searches saved yet.</p>}
          </div>
        </Card>
        <div>
          <h2 className="mb-3 text-lg font-semibold">Recent leads</h2>
          <LeadTable leads={recentLeads} />
        </div>
      </section>
    </div>
  );
}
