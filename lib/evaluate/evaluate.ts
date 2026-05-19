import { gradeFromScore, scoreLead } from "@/lib/scoring/scoring";
import type { CandidateCompany } from "@/lib/search/candidates";
import type { SearchConfig } from "@/lib/search/schemas";

export function evaluateCandidate(config: SearchConfig, candidate: CandidateCompany) {
  const signalText = candidate.observed_signals.join(" ").toLowerCase();
  const positiveHits = config.ideal_client_signals.filter((signal) => signalText.includes(signal.toLowerCase()));

  // Match exclusion criteria against everything observable about the candidate
  // — name, description, and detected signals — not just observed_signals.
  const excludeText = [candidate.company_name, candidate.company_description, signalText]
    .join(" ")
    .toLowerCase();
  const excludeHits = config.exclude_signals
    .map((signal) => signal.trim())
    .filter((signal) => signal.length > 0 && excludeText.includes(signal.toLowerCase()));
  const isExcluded = excludeHits.length > 0;
  const hasWebsite = Boolean(candidate.website);
  const hasContact = Boolean(candidate.public_email || candidate.public_phone || candidate.contact_page);
  const hasSources = candidate.sources.length > 0;
  const problemVisibility = Math.min(95, 45 + positiveHits.length * 13);
  const icpFit = candidate.industry.toLowerCase().includes(config.industry.toLowerCase().split(" ")[0]) ? 86 : 68;
  const contactability = hasContact ? (candidate.public_email && candidate.public_phone ? 92 : 74) : 25;
  const legitimacy = hasWebsite && hasSources ? 85 : 55;
  const commercialPotential = candidate.observed_signals.includes("enterprise brand") ? 55 : 74;
  const personalizationPotential = candidate.company_description && positiveHits.length ? 82 : 58;
  const confidence = hasSources ? Math.min(90, 62 + positiveHits.length * 8) : 42;

  const score = scoreLead(
    {
      icpFit,
      problemVisibility,
      contactability,
      legitimacy,
      commercialPotential,
      personalizationPotential,
      confidence
    },
    {
      icpFit: `Matches ${config.country}${config.city ? ` / ${config.city}` : ""} and appears related to ${config.industry}.`,
      problemVisibility: positiveHits.length
        ? `Observed signals match: ${positiveHits.join(", ")}.`
        : "Few requested problem signals were visible in the candidate record.",
      contactability: hasContact
        ? "Public company-level contact channels are available."
        : "No useful public company-level contact channel was found.",
      legitimacy: hasWebsite && hasSources ? "Website and source links are present." : "Evidence is limited.",
      commercialPotential: "Estimated from business type, local commercial relevance, and visible opportunity.",
      personalizationPotential: candidate.company_description
        ? "There is enough company context to write a relevant manual outreach draft."
        : "Public context is thin.",
      confidence: hasSources ? "Source evidence is present." : "Confidence is reduced because source evidence is weak."
    }
  );

  // A candidate matching any exclusion criterion is off-target by definition.
  // Cap its score well below any usable threshold so it drops out of exports.
  const finalScore = isExcluded ? Math.min(score.score, 12) : score.score;

  return {
    ...candidate,
    score: finalScore,
    fit_grade: gradeFromScore(finalScore),
    contactability_score: score.contactability_score,
    confidence_score: score.confidence_score,
    score_explanation: score.explanation,
    reason_for_fit: isExcluded
      ? `Excluded — matches exclusion criteria: ${excludeHits.join(", ")}.`
      : positiveHits.length
      ? `The company matches the target profile and shows visible signals relevant to ${config.service_offered}: ${positiveHits.join(", ")}.`
      : `The company may match the target profile, but requested problem signals need manual validation.`,
    visible_opportunities: positiveHits.length ? positiveHits : candidate.observed_signals.slice(0, 3),
    suggested_offer: `${config.service_offered} for ${candidate.industry.toLowerCase()} teams.`,
    suggested_outreach_angle: `Focus on a practical improvement related to ${positiveHits[0] ?? config.service_offered}, backed by public observations only.`
  };
}
