export type ScoreInputs = {
  icpFit: number;
  problemVisibility: number;
  contactability: number;
  legitimacy: number;
  commercialPotential: number;
  personalizationPotential: number;
  confidence: number;
};

export type ScoreResult = {
  score: number;
  fit_grade: "A" | "B" | "C" | "D" | "F";
  contactability_score: number;
  confidence_score: number;
  explanation: Array<{ dimension: string; score: number; reason: string }>;
};

const weights = {
  icpFit: 0.25,
  problemVisibility: 0.2,
  contactability: 0.15,
  legitimacy: 0.15,
  commercialPotential: 0.1,
  personalizationPotential: 0.1,
  confidence: 0.05
};

export function gradeFromScore(score: number): ScoreResult["fit_grade"] {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function scoreLead(inputs: ScoreInputs, reasons: Partial<Record<keyof ScoreInputs, string>>): ScoreResult {
  const score = Math.round(
    Object.entries(weights).reduce((sum, [key, weight]) => sum + inputs[key as keyof ScoreInputs] * weight, 0)
  );

  const labels: Record<keyof ScoreInputs, string> = {
    icpFit: "ICP fit",
    problemVisibility: "Problem visibility",
    contactability: "Contactability",
    legitimacy: "Business legitimacy",
    commercialPotential: "Commercial potential",
    personalizationPotential: "Personalization potential",
    confidence: "Confidence"
  };

  return {
    score,
    fit_grade: gradeFromScore(score),
    contactability_score: inputs.contactability,
    confidence_score: inputs.confidence,
    explanation: Object.keys(labels).map((key) => ({
      dimension: labels[key as keyof ScoreInputs],
      score: inputs[key as keyof ScoreInputs],
      reason: reasons[key as keyof ScoreInputs] ?? "No additional explanation available."
    }))
  };
}
