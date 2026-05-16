import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui";
import { commaList } from "@/lib/search/guided";
import { desiredPublicData, searchConfigSchema } from "@/lib/search/schemas";

export default function ConfirmSearchPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const value = (key: string) => {
    const raw = searchParams[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };
  const config = searchConfigSchema.parse({
    name: value("name"),
    country: value("country"),
    region: value("region") || null,
    city: value("city") || null,
    language: value("language") || null,
    industry: value("industry"),
    service_offered: value("service_offered"),
    target_client_type: value("target_client_type") || null,
    ideal_client_signals: commaList(value("ideal_client_signals") ?? null),
    exclude_signals: commaList(value("exclude_signals") ?? null),
    desired_public_data: desiredPublicData,
    number_of_results: value("number_of_results"),
    minimum_score: value("minimum_score"),
    output_format: value("output_format") || "table"
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Confirm search configuration</h1>
        <p className="mt-2 text-sm text-moss">Review the structured configuration. Running the search saves the search and matching leads to SQLite.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <pre className="max-h-[620px] overflow-auto rounded-md bg-ink p-4 text-xs leading-6 text-white">{JSON.stringify(config, null, 2)}</pre>
          <form action="/api/searches/run" method="post" className="mt-5">
            <input type="hidden" name="config" value={JSON.stringify(config)} />
            <button className="focus-ring rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-ink">Run search</button>
          </form>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-pine" />
            <h2 className="text-lg font-semibold">Research guardrails</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-moss">
            <li>Only public company-level data is stored.</li>
            <li>Unknown emails, phones, and source links remain null or empty.</li>
            <li>Every lead includes transparent score reasons.</li>
            <li>Outreach drafts are never sent automatically.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
