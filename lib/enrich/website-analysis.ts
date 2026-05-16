export type WebsiteObservation = {
  url: string;
  factualObservations: string[];
  possibleOpportunities: string[];
  missingData: string[];
};

export async function analyzeWebsitePlaceholder(url: string): Promise<WebsiteObservation> {
  return {
    url,
    factualObservations: ["Website analysis provider not configured in this MVP."],
    possibleOpportunities: [],
    missingData: ["automated_website_analysis"]
  };
}

export const websiteAnalysisRules = [
  "Respect robots.txt and website terms.",
  "Do not bypass CAPTCHAs, authentication, paywalls, or rate limits.",
  "Collect only business-level facts needed for lead evaluation.",
  "Separate factual observations from AI interpretation."
];
