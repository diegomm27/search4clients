import { prisma } from "@/lib/storage/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const leads = await prisma.lead.findMany({ orderBy: [{ score: "desc" }, { created_at: "desc" }] });
  return Response.json(leads);
}
