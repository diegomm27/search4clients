type ComparableLead = {
  id: number;
  company_name: string;
  website?: string | null;
  public_email?: string | null;
  public_phone?: string | null;
  city?: string | null;
  country?: string | null;
};

function normalize(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^\p{L}\p{N}@.+-]+/gu, " ")
    .trim();
}

export function dedupeKey(lead: ComparableLead) {
  return [
    normalize(lead.website),
    normalize(lead.public_email),
    normalize(lead.public_phone),
    normalize(lead.company_name),
    normalize(lead.city),
    normalize(lead.country)
  ]
    .filter(Boolean)
    .join("|");
}

export function findDuplicateGroups<T extends ComparableLead>(leads: T[]) {
  const groups = new Map<string, T[]>();
  for (const lead of leads) {
    const key = dedupeKey(lead);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) || []), lead]);
  }
  return Array.from(groups.values()).filter((group) => group.length > 1);
}
