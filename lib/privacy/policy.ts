export const privacyPrinciples = [
  "Use only publicly available company-level information.",
  "Do not bypass authentication, paywalls, CAPTCHAs, robots.txt, rate limits, or platform restrictions.",
  "Prefer general company contact channels over personal data.",
  "Never fabricate emails, phone numbers, sources, or company facts.",
  "Outreach drafts are AI-generated and require human review.",
  "search4clients never sends messages automatically."
];

export function dataSentToAI(fields: string[]) {
  return [
    "The user's search objective and selected criteria.",
    "Public company facts discovered during research.",
    "Public website observations needed for scoring.",
    ...fields.map((field) => `Selected field: ${field}`)
  ];
}
