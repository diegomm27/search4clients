import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui";
import { defaultDesiredPublicData, desiredPublicData, searchConfigSchema } from "@/lib/search/schemas";
import { searchRunLabel } from "@/lib/search/provider-mode";

const publicDataLabels: Record<string, string> = {
  company_name: "Company name",
  website: "Website",
  public_email: "Public email",
  public_phone: "Public phone",
  contact_page: "Contact page",
  city: "City",
  country: "Country",
  industry: "Industry",
  company_description: "Company description",
  social_profiles: "Social profiles",
  linkedin_company_page: "LinkedIn company page",
  source_links: "Source links",
  reason_for_fit: "Why this lead",
  suggested_outreach_angle: "Suggested outreach angle"
};

function friendlySearchError(path: string, message: string) {
  if (path === "service_offered") return "Please describe what you sell.";
  if (path === "industry") return "Please describe who you want as clients.";
  if (path === "country") return "Please enter a country.";
  if (path === "max_results") return "Maximum results must be a positive whole number.";
  return message;
}

function commaList(value: string | null | undefined): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ConfirmSearchPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const value = (key: string) => {
    const raw = searchParams[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };
  const values = (key: string) => {
    const raw = searchParams[key];
    return Array.isArray(raw) ? raw : raw ? [raw] : [];
  };
  const service = value("service_offered")?.trim();
  const industry = value("industry")?.trim();
  const city = value("city")?.trim();
  const country = value("country")?.trim();
  const generatedName = [city, country, industry].filter(Boolean).join(" ") + (service ? ` for ${service}` : "");
  const requestedPublicData = Array.from(new Set([...defaultDesiredPublicData, ...values("desired_public_data")]))
    .filter((item): item is (typeof desiredPublicData)[number] => desiredPublicData.includes(item as (typeof desiredPublicData)[number]));
  const result = searchConfigSchema.safeParse({
    name: value("name") || generatedName || "Client search",
    country: value("country"),
    region: value("region") || null,
    city: value("city") || null,
    language: value("language") || null,
    industry: value("industry"),
    service_offered: value("service_offered"),
    target_client_type: value("target_client_type") || null,
    ideal_client_signals: commaList(value("ideal_client_signals") ?? null),
    exclude_signals: commaList(value("exclude_signals") ?? null),
    desired_public_data: requestedPublicData,
    max_results: value("max_results") || null,
    output_format: "dashboard"
  });

  if (!result.success) {
    const first = result.error.issues[0];
    const error = friendlySearchError(String(first.path[0] || ""), first.message);
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-3xl font-semibold">Review search</h1>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>
        <Link href={`/searches/new?error=${encodeURIComponent(error)}`} className="focus-ring inline-flex rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-ink">
          Edit search
        </Link>
      </div>
    );
  }

  const config = result.data;
  const location = [config.city, config.country].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Review search</h1>
        <p className="mt-2 text-sm text-moss">Confirm what you want before results are generated.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <p className="text-lg leading-8">
            You are looking for {config.industry} in {location || config.country} that may need {config.service_offered}.
          </p>
          <div className="mt-5">
            <h2 className="text-sm font-semibold">We will include:</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-moss">
              {config.desired_public_data.map((item) => <li key={item}>{publicDataLabels[item]}</li>)}
            </ul>
          </div>
          <div className="mt-5">
            <h2 className="text-sm font-semibold">Optional buying signals:</h2>
            {config.ideal_client_signals.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-moss">
                {config.ideal_client_signals.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : <p className="mt-2 text-sm text-moss">No extra buying signals provided.</p>}
          </div>
          <div className="mt-5">
            <h2 className="text-sm font-semibold">We will exclude:</h2>
            {config.exclude_signals.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-moss">
                {config.exclude_signals.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : <p className="mt-2 text-sm text-moss">No exclusions provided.</p>}
          </div>
          <p className="mt-5 text-sm text-moss">Every matching company will be returned, ranked by fit score.</p>
          {config.max_results ? <p className="mt-1 text-sm text-moss">Capped at {config.max_results} results.</p> : null}

          <form action="/api/searches/run" method="post" className="mt-5">
            <input type="hidden" name="config" value={JSON.stringify(config)} />
            <div className="flex flex-wrap gap-3">
              <button className="focus-ring rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-ink">{searchRunLabel()}</button>
              <Link href="/searches/new" className="focus-ring rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-paper">Edit search</Link>
            </div>
          </form>

          <details className="mt-6 rounded-md border border-line p-4">
            <summary className="cursor-pointer text-sm font-medium">View technical configuration</summary>
            <pre className="mt-4 max-h-[420px] overflow-auto rounded-md bg-ink p-4 text-xs leading-6 text-white">{JSON.stringify(config, null, 2)}</pre>
          </details>
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
