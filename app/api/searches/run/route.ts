import { redirect } from "next/navigation";
import { runSearch } from "@/lib/search/orchestrator";
import { searchConfigSchema } from "@/lib/search/schemas";

export async function POST(request: Request) {
  const form = await request.formData();
  const raw = String(form.get("config") || "{}");
  const config = searchConfigSchema.parse(JSON.parse(raw));
  const search = await runSearch(config);
  redirect(`/searches/results?id=${search.id}`);
}
