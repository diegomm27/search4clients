import { readSettings } from "./settings";

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

class OpenAIProvider implements AIProvider {
  name: AIProviderName = "openai";

  constructor(private readonly apiKey: string, private readonly model = "gpt-4.1-mini") {}

  async generateOutreachDraft(input: OutreachRequest) {
    const prompt = [
      "Write a concise B2B outreach draft as JSON with keys subject and body.",
      "The draft must be clearly suitable for manual review before sending.",
      "Do not invent facts, names, emails, phone numbers, or source links.",
      `Company: ${input.companyName}`,
      `Service offered: ${input.serviceOffered}`,
      `Reason for fit: ${input.reasonForFit}`,
      input.outreachAngle ? `Outreach angle: ${input.outreachAngle}` : null
    ].filter(Boolean).join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        instructions: "You draft short B2B outreach text. Return only valid JSON.",
        input: prompt,
        max_output_tokens: 600
      })
    });

    if (!response.ok) {
      throw new Error("OpenAI request failed");
    }

    const data = await response.json();
    const text = extractResponseText(data);
    const parsed = JSON.parse(stripJsonFence(text)) as { subject?: string; body?: string };

    if (!parsed.subject || !parsed.body) {
      throw new Error("OpenAI response was missing draft fields");
    }

    return {
      subject: parsed.subject,
      body: parsed.body
    };
  }
}

function stripJsonFence(text: string) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function extractResponseText(data: unknown) {
  if (typeof data === "object" && data && "output_text" in data && typeof data.output_text === "string") {
    return data.output_text;
  }

  const output = typeof data === "object" && data && "output" in data && Array.isArray(data.output) ? data.output : [];
  for (const item of output) {
    if (typeof item !== "object" || !item || !("content" in item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (typeof content === "object" && content && "text" in content && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI response did not include text");
}

export async function getAIProvider(): Promise<AIProvider> {
  const settings = await readSettings();
  const apiKey = settings.apiKey;

  if (settings.provider === "openai" && apiKey) {
    return new OpenAIProvider(apiKey);
  }

  return new MockProvider();
}
