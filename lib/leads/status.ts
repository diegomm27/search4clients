export const visibleLeadStatuses = [
  { label: "New", value: "new" },
  { label: "Good fit", value: "approved" },
  { label: "Not a fit", value: "rejected" },
  { label: "Contacted", value: "contacted" }
] as const;

export type VisibleLeadStatus = (typeof visibleLeadStatuses)[number]["value"];

export function leadStatusLabel(status: string) {
  return visibleLeadStatuses.find((item) => item.value === status)?.label ?? "New";
}

export function fitLabel(score: number) {
  if (score >= 80) return "Strong fit";
  if (score >= 60) return "Possible fit";
  return "Weak fit";
}
