import { redirect } from "next/navigation";
import { runSearch } from "@/lib/search/orchestrator";
import { searchConfigSchema } from "@/lib/search/schemas";

function friendlySearchError(path: string) {
  if (path === "service_offered") return "Please describe what you sell.";
  if (path === "industry") return "Please describe who you want as clients.";
  if (path === "country") return "Please enter a country.";
  if (path === "minimum_score") return "Minimum score must be between 0 and 100.";
  if (path === "number_of_results") return "Result count must be between 1 and 100.";
  return "Please check the search details and try again.";
}

export async function POST(request: Request) {
  const form = await request.formData();
  const raw = String(form.get("config") || "{}");
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    redirect(`/searches/new?error=${encodeURIComponent("Please check the search details and try again.")}`);
  }
  const result = searchConfigSchema.safeParse(parsedJson);
  if (!result.success) {
    const first = result.error.issues[0];
    redirect(`/searches/new?error=${encodeURIComponent(friendlySearchError(String(first.path[0] || "")))}`);
  }
  const config = result.data;
  const search = await runSearch(config);
  redirect(`/searches/results?id=${search.id}`);
}
