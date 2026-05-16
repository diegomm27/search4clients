import { redirect } from "next/navigation";
import { getAIProvider } from "@/lib/ai/provider";
import { prisma } from "@/lib/storage/prisma";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({ where: { id: Number(params.id) }, include: { search: true } });
  if (!lead || lead.status !== "approved") {
    redirect(`/leads/${params.id}`);
  }

  const provider = getAIProvider();
  const draft = await provider.generateOutreachDraft({
    companyName: lead.company_name,
    serviceOffered: lead.search?.service_offered || lead.suggested_offer || "the discussed service",
    reasonForFit: lead.reason_for_fit,
    outreachAngle: lead.suggested_outreach_angle
  });

  await prisma.outreachDraft.create({
    data: {
      lead_id: lead.id,
      channel: "email",
      subject: draft.subject,
      body: draft.body
    }
  });

  redirect(`/leads/${params.id}`);
}
