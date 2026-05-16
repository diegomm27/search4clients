import type { SearchConfig } from "./schemas";

export type GuidedQuestion = {
  id: keyof SearchConfig | "collect_contact" | "sources" | "signals";
  label: string;
  helper: string;
  placeholder?: string;
  type: "text" | "textarea" | "number" | "checkbox";
};

export function getMissingSearchQuestions(partial: Partial<SearchConfig>): GuidedQuestion[] {
  const questions: GuidedQuestion[] = [];

  if (!partial.country) {
    questions.push({
      id: "country",
      label: "Target country",
      helper: "The country where companies should operate.",
      placeholder: "Spain",
      type: "text"
    });
  }
  if (!partial.industry) {
    questions.push({
      id: "industry",
      label: "Business type or industry",
      helper: "Be specific enough to avoid generic results.",
      placeholder: "Small dental clinics",
      type: "text"
    });
  }
  if (!partial.service_offered) {
    questions.push({
      id: "service_offered",
      label: "Service or product offered",
      helper: "What you want to sell to these companies.",
      placeholder: "Website redesign and local SEO",
      type: "text"
    });
  }
  if (!partial.ideal_client_signals?.length) {
    questions.push({
      id: "ideal_client_signals",
      label: "Positive buying signals",
      helper: "Signals the research should look for.",
      placeholder: "outdated website, no online booking, weak local SEO",
      type: "textarea"
    });
  }
  if (!partial.exclude_signals?.length) {
    questions.push({
      id: "exclude_signals",
      label: "Disqualifying signals",
      helper: "Companies that should be filtered out.",
      placeholder: "large chains, franchises, hospitals",
      type: "textarea"
    });
  }
  if (!partial.number_of_results) {
    questions.push({
      id: "number_of_results",
      label: "Result count",
      helper: "How many potential clients should be returned?",
      placeholder: "50",
      type: "number"
    });
  }

  return questions;
}

export function commaList(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
