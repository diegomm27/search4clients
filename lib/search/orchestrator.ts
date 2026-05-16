import { prisma } from "@/lib/storage/prisma";
import { evaluateCandidate } from "@/lib/evaluate/evaluate";
import { encodeJson } from "@/lib/storage/json";
import { discoverDemoCandidates } from "./demo-source";
import type { SearchConfig } from "./schemas";

export async function runSearch(config: SearchConfig) {
  const search = await prisma.search.create({
    data: {
      name: config.name,
      country: config.country,
      region: config.region || null,
      city: config.city || null,
      language: config.language || null,
      industry: config.industry,
      service_offered: config.service_offered,
      target_client_type: config.target_client_type || null,
      ideal_client_signals: encodeJson(config.ideal_client_signals),
      exclude_signals: encodeJson(config.exclude_signals),
      desired_public_data: encodeJson(config.desired_public_data),
      number_of_results: config.number_of_results,
      minimum_score: config.minimum_score,
      output_format: config.output_format,
      status: "running",
      notes: config.notes
    }
  });

  const candidates = await discoverDemoCandidates(config);
  const evaluated = candidates
    .map((candidate) => evaluateCandidate(config, candidate))
    .filter((lead) => lead.score >= config.minimum_score);

  for (const lead of evaluated) {
    const savedLead = await prisma.lead.create({
      data: {
        search_id: search.id,
        company_name: lead.company_name,
        country: lead.country,
        region: lead.region,
        city: lead.city,
        industry: lead.industry,
        business_category: lead.business_category,
        website: lead.website,
        contact_page: lead.contact_page,
        public_email: lead.public_email,
        public_phone: lead.public_phone,
        linkedin_company_page: lead.linkedin_company_page,
        social_profiles: encodeJson(lead.social_profiles),
        company_description: lead.company_description,
        score: lead.score,
        fit_grade: lead.fit_grade,
        contactability_score: lead.contactability_score,
        confidence_score: lead.confidence_score,
        reason_for_fit: lead.reason_for_fit,
        visible_opportunities: encodeJson(lead.visible_opportunities),
        suggested_offer: lead.suggested_offer,
        suggested_outreach_angle: lead.suggested_outreach_angle,
        sources: encodeJson(lead.sources),
        score_explanation: encodeJson(lead.score_explanation)
      }
    });

    await prisma.source.createMany({
      data: lead.sources.map((url) => ({
        lead_id: savedLead.id,
        url,
        source_type: url.includes("linkedin.com") ? "linkedin_company_page" : "public_web",
        title: lead.company_name,
        snippet: lead.company_description
      }))
    });
  }

  return prisma.search.update({
    where: { id: search.id },
    data: { status: "completed" },
    include: { leads: true }
  });
}
