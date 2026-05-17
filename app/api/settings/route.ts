import { redirect } from "next/navigation";
import { z } from "zod";
import { writeSettings } from "@/lib/ai/settings";

const settingsSchema = z.object({
  provider: z.enum(["mock", "openai"]).default("mock"),
  apiKey: z.string().optional(),
  storagePath: z.string().min(1).default("prisma/dev.db")
});

export async function POST(request: Request) {
  const form = await request.formData();
  const result = settingsSchema.safeParse({
    provider: form.get("provider") || "mock",
    apiKey: String(form.get("apiKey") || ""),
    storagePath: String(form.get("storagePath") || "prisma/dev.db")
  });
  if (!result.success) {
    redirect(`/settings?error=${encodeURIComponent("Please check the settings and try again.")}`);
  }
  await writeSettings(result.data);
  redirect("/settings");
}
