import { redirect } from "next/navigation";
import { writeSettings } from "@/lib/ai/settings";

export async function POST(request: Request) {
  const form = await request.formData();
  await writeSettings({
    provider: (form.get("provider") as "openai" | "mock") || "mock",
    apiKey: String(form.get("apiKey") || ""),
    storagePath: String(form.get("storagePath") || "prisma/dev.db")
  });
  redirect("/settings");
}
