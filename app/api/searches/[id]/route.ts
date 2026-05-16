import { redirect } from "next/navigation";
import { prisma } from "@/lib/storage/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const form = await request.formData();
  if (form.get("intent") === "delete") {
    await prisma.search.delete({ where: { id: Number(params.id) } });
  }
  redirect("/");
}
