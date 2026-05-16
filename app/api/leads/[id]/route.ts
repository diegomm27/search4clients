import { redirect } from "next/navigation";
import { prisma } from "@/lib/storage/prisma";
import { leadStatusSchema } from "@/lib/search/schemas";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const form = await request.formData();
  if (form.get("intent") === "delete") {
    await prisma.lead.delete({ where: { id: Number(params.id) } });
    redirect("/leads");
  }
  const status = leadStatusSchema.parse(form.get("status"));
  await prisma.lead.update({
    where: { id: Number(params.id) },
    data: {
      status,
      notes: String(form.get("notes") || "")
    }
  });
  redirect(`/leads/${params.id}`);
}
