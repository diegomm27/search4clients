import { readFile } from "fs/promises";
import { z } from "zod";

const selectorsSchema = z.object({
  item: z.string(),
  name: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  nextButton: z.string().optional()
});

const playwrightConfigSchema = z.object({
  entryUrl: z.string(),
  paginationType: z.enum(["query-param", "next-button", "load-more", "cursor"]),
  paginationParam: z.string().optional(),
  selectors: selectorsSchema,
  stopCondition: z.enum(["empty-page", "no-next-button", "max-pages"]).default("no-next-button"),
  maxPages: z.number().int().positive().default(50),
  delayMs: z.number().int().min(0).default(1500)
});

const sourceEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(["api", "browser"]),
  enabled: z.boolean().default(true),
  countries: z.array(z.string()).default(["*"]),
  categories: z.array(z.string()).default(["*"]),
  free: z.boolean().default(true),
  requiresKey: z.string().optional(),
  note: z.string().optional(),
  playwright: playwrightConfigSchema.optional()
});

export type SourceEntry = z.infer<typeof sourceEntrySchema>;
export type PlaywrightConfig = z.infer<typeof playwrightConfigSchema>;

const sourcesFileSchema = z.object({
  sources: z.array(sourceEntrySchema)
});

export async function loadSources(filePath: string): Promise<SourceEntry[]> {
  const raw = await readFile(filePath, "utf8");
  const parsed = sourcesFileSchema.parse(JSON.parse(raw));
  return parsed.sources;
}

export function filterSources(
  sources: SourceEntry[],
  countryIso: string,
  categoryId: string,
  env: Record<string, string | undefined>
): SourceEntry[] {
  return sources.filter((s) => {
    if (!s.enabled) return false;
    if (s.requiresKey && !env[s.requiresKey]) return false;
    const countryMatch = s.countries.includes("*") || s.countries.includes(countryIso.toUpperCase());
    const categoryMatch = s.categories.includes("*") || s.categories.includes(categoryId);
    return countryMatch && categoryMatch;
  });
}
