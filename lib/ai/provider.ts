export type AIProviderName = "openai" | "mock";

export type OutreachRequest = {
  companyName: string;
  serviceOffered: string;
  reasonForFit: string;
  outreachAngle?: string | null;
};

export interface AIProvider {
  name: AIProviderName;
  generateOutreachDraft(input: OutreachRequest): Promise<{ subject: string; body: string }>;
}

class MockProvider implements AIProvider {
  name: AIProviderName = "mock";

  async generateOutreachDraft(input: OutreachRequest) {
    return {
      subject: `AI-generated draft: practical idea for ${input.companyName}`,
      body: [
        "AI-GENERATED DRAFT - REVIEW BEFORE SENDING",
        "",
        `Hi ${input.companyName} team,`,
        "",
        `I noticed a potential opportunity around ${input.reasonForFit.toLowerCase()}`,
        `I help companies improve results with ${input.serviceOffered}.`,
        input.outreachAngle ? `A practical starting point could be: ${input.outreachAngle}` : null,
        "",
        "Would it be useful if I shared a short, no-pressure improvement checklist for your website?",
        "",
        "Best,"
      ]
        .filter(Boolean)
        .join("\n")
    };
  }
}

export function getAIProvider(): AIProvider {
  return new MockProvider();
}
