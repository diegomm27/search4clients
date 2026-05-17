import { prisma } from "@/lib/storage/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const searches = await prisma.search.findMany({ orderBy: { created_at: "desc" }, include: { leads: true } });
  return Response.json(searches);
}
