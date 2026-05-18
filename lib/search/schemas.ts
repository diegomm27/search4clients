import { z } from "zod";

export const leadStatuses = [
  "new",
  "reviewed",
  "approved",
  "rejected",
  "contacted",
  "replied",
  "meeting_booked",
  "client_won",
  "client_lost",
  "do_not_contact"
] as const;

export const desiredPublicData = [
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
] as const;

export const defaultDesiredPublicData = [
  "company_name",
  "website",
  "contact_page",
  "city",
  "country",
  "industry",
  "company_description",
  "source_links",
  "reason_for_fit"
] as const;

export const searchConfigSchema = z.object({
  name: z.string().min(2),
  country: z.string().min(2),
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  industry: z.string().min(2),
  service_offered: z.string().min(2),
  target_client_type: z.string().nullable().optional(),
  ideal_client_signals: z.array(z.string()).default([]),
  exclude_signals: z.array(z.string()).default([]),
  desired_public_data: z.array(z.enum(desiredPublicData)).default([...defaultDesiredPublicData]),
  max_results: z.coerce.number().int().min(1).nullable().optional(),
  output_format: z.enum(["table", "csv", "json", "markdown", "sqlite", "dashboard"]).default("table"),
  notes: z.string().optional()
});

export type SearchConfig = z.infer<typeof searchConfigSchema>;

export const leadStatusSchema = z.enum(leadStatuses);
