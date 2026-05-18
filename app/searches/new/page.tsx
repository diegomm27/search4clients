import { Play } from "lucide-react";
import { Card, Input, Textarea } from "@/components/ui";

const publicDataOptions = [
  { value: "website", label: "Website" },
  { value: "contact_page", label: "Contact page" },
  { value: "public_email", label: "Public email" },
  { value: "public_phone", label: "Public phone" },
  { value: "linkedin_company_page", label: "LinkedIn company page" },
  { value: "social_profiles", label: "Social profiles" },
  { value: "company_description", label: "Company description" },
  { value: "source_links", label: "Source links" },
  { value: "suggested_outreach_angle", label: "Suggested outreach angle" }
] as const;

export default function NewSearchPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Find clients</h1>
        <p className="mt-2 text-sm text-moss">Answer four questions. You will review the search before any results are generated.</p>
      </div>
      {searchParams.error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{searchParams.error}</div>
      )}
      <Card>
        <form action="/searches/confirm" className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">What do you sell?</span>
            <Input name="service_offered" required placeholder="Website redesign" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Who do you want as clients?</span>
            <Input name="industry" required placeholder="Dental clinics" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">City (optional)</span>
              <Input name="city" placeholder="Madrid" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Country</span>
              <Input name="country" required placeholder="Spain" />
            </label>
          </div>
          <fieldset className="rounded-md border border-line p-4">
            <legend className="px-1 text-sm font-medium">What data do you want for each potential client?</legend>
            <p className="mt-1 text-sm text-moss">Company name, location, industry, fit reason, and score are always included.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {publicDataOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="desired_public_data"
                    value={option.value}
                    defaultChecked={["website", "contact_page", "company_description", "source_links"].includes(option.value)}
                    className="h-4 w-4 rounded border-line text-pine"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <details className="rounded-md border border-line p-4">
            <summary className="cursor-pointer text-sm font-medium">Advanced options</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium">Search name</span>
                <Input name="name" placeholder="Madrid dental clinics for website redesign" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium">Exclude signals</span>
                <Textarea name="exclude_signals" placeholder="large chains, franchises" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium">Buying signals to look for</span>
                <Textarea name="ideal_client_signals" placeholder="old website, no online booking, poor mobile design" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium">Maximum results (optional)</span>
                <Input name="max_results" type="number" min={1} placeholder="Leave empty to return every match" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium">Language</span>
                <Input name="language" placeholder="Spanish" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium">Ideal client type</span>
                <Input name="target_client_type" placeholder="Small independent local businesses" />
              </label>
            </div>
          </details>

          <div>
            <button className="focus-ring inline-flex items-center gap-2 rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-ink">
              <Play className="h-4 w-4" />
              Review configuration
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
