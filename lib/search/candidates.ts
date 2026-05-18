import { readFile } from "fs/promises";
import { z } from "zod";

export type CandidateCompany = {
  company_name: string;
  country: string;
  region?: string | null;
  city?: string | null;
  industry: string;
  business_category: string;
  website?: string | null;
  contact_page?: string | null;
  public_email?: string | null;
  public_phone?: string | null;
  linkedin_company_page?: string | null;
  social_profiles: string[];
  company_description: string;
  observed_signals: string[];
  sources: string[];
};

const candidateSchema = z.object({
  company_name: z.string().min(1),
  country: z.string().min(1),
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  industry: z.string().min(1),
  business_category: z.string().min(1).default("Unknown"),
  website: z.string().nullable().optional(),
  contact_page: z.string().nullable().optional(),
  public_email: z.string().nullable().optional(),
  public_phone: z.string().nullable().optional(),
  linkedin_company_page: z.string().nullable().optional(),
  social_profiles: z.array(z.string()).default([]),
  company_description: z.string().default(""),
  observed_signals: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([])
});

export const candidatesFileSchema = z.object({
  generated_by: z.string().optional(),
  generated_at: z.string().optional(),
  request_name: z.string().optional(),
  candidates: z.array(candidateSchema).min(1)
});

export type CandidatesFile = z.infer<typeof candidatesFileSchema>;

export async function loadResearchCandidates(filePath: string): Promise<CandidateCompany[]> {
  const raw = await readFile(filePath, "utf8");
  const parsed = candidatesFileSchema.parse(JSON.parse(raw));
  return parsed.candidates.map((candidate) => ({
    ...candidate,
    region: candidate.region ?? null,
    city: candidate.city ?? null,
    website: candidate.website ?? null,
    contact_page: candidate.contact_page ?? null,
    public_email: candidate.public_email ?? null,
    public_phone: candidate.public_phone ?? null,
    linkedin_company_page: candidate.linkedin_company_page ?? null
  }));
}
