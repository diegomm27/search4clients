import Link from "next/link";
import { ArrowRight, CheckCircle2, Search } from "lucide-react";
import { prisma } from "@/lib/storage/prisma";
import { Card } from "@/components/ui";
import { LeadCardGrid } from "@/components/lead-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [recentLeads, searches] = await Promise.all([
    prisma.lead.findMany({ orderBy: { created_at: "desc" }, take: 5 }),
    prisma.search.findMany({ orderBy: { created_at: "desc" }, take: 5, include: { leads: true } })
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-line bg-white p-8">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-ink">Find better potential clients</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-moss">
          Describe who you want to work with. search4clients helps you find, score, and review potential B2B clients before you take action.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/searches/new" className="focus-ring inline-flex items-center gap-2 rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-ink">
            <Search className="h-4 w-4" />
            Find clients
          </Link>
          <Link href="/leads" className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-paper">
            Review potential clients
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent searches</h2>
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
          <h2 className="mb-3 text-lg font-semibold">Recent potential clients</h2>
          <LeadCardGrid leads={recentLeads} />
        </div>
      </section>

      <Card>
        <h2 className="text-lg font-semibold">How this stays safe</h2>
        <ul className="mt-4 grid gap-3 text-sm text-moss md:grid-cols-2">
          <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-pine" /> No automatic emails or messages.</li>
          <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-pine" /> No fabricated leads or guessed contacts.</li>
          <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-pine" /> Public business data only.</li>
          <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-pine" /> Outreach drafts require manual approval.</li>
        </ul>
      </Card>
    </div>
  );
}
