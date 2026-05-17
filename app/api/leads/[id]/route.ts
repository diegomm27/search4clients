import { redirect } from "next/navigation";
import { prisma } from "@/lib/storage/prisma";
import { leadStatusSchema } from "@/lib/search/schemas";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    redirect("/leads?error=Lead%20not%20found");
  }
  const form = await request.formData();
  if (form.get("intent") === "delete") {
    await prisma.lead.delete({ where: { id } });
    redirect("/leads");
  }
  const statusResult = leadStatusSchema.safeParse(form.get("status"));
  if (!statusResult.success) {
    redirect(`/leads/${params.id}?error=${encodeURIComponent("Please choose a valid status.")}`);
  }
  const existing = await prisma.lead.findUnique({ where: { id }, select: { notes: true } });
  if (!existing) {
    redirect("/leads?error=Lead%20not%20found");
  }
  const noteValue = form.has("notes") ? String(form.get("notes") || "") : existing.notes;
  await prisma.lead.update({
    where: { id },
    data: {
      status: statusResult.data,
      notes: noteValue
    }
  });
  redirect(`/leads/${params.id}`);
}
