import { runSearch } from "@/lib/search/orchestrator";
import { prisma } from "@/lib/storage/prisma";

async function main() {
  await prisma.outreachDraft.deleteMany();
  await prisma.source.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.search.deleteMany();

  await runSearch({
    name: "Spain dental clinics for web design",
    country: "Spain",
    region: null,
    city: null,
    language: "Spanish",
    industry: "Dental clinics",
    service_offered: "Website redesign and local SEO",
    target_client_type: "Small independent local businesses",
    ideal_client_signals: ["outdated website", "no online booking", "weak local SEO", "no clear CTA"],
    exclude_signals: ["large chains", "franchises", "enterprise brand"],
    desired_public_data: [
      "company_name",
      "website",
      "public_email",
      "public_phone",
      "contact_page",
      "city",
      "country",
      "industry",
      "company_description",
      "social_profiles",
      "linkedin_company_page",
      "source_links",
      "reason_for_fit",
      "suggested_outreach_angle"
    ],
    number_of_results: 10,
    minimum_score: 60,
    output_format: "table"
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
