import {
  investigatorReportJsonSchema,
  type InvestigatorReportJson,
  type InvestigatorReportSection,
  type InvestigatorSlotJson
} from "@vnexus/shared";

function buildSectionTitle(bundle: InvestigatorSlotJson["bundles"][number]) {
  return [bundle.canonicalDate, bundle.bundleTypeCandidate].join(" | ");
}

function buildReviewSignalSummary(bundle: InvestigatorSlotJson["bundles"][number]) {
  const summary: string[] = [];

  if (bundle.bundleQualityGate.bundleQualityState !== "supported") {
    summary.push(`bundleQualityState=${bundle.bundleQualityGate.bundleQualityState}`);
  }

  const unresolvedLabels = Object.entries(bundle.bundleQualityGate.unresolvedFlags)
    .filter(([, value]) => value)
    .map(([label]) => label);

  if (unresolvedLabels.length > 0) {
    summary.push(`unresolvedFlags=${unresolvedLabels.join(",")}`);
  }

  return summary;
}

export function buildInvestigatorReport(
  caseId: string,
  slotJson: InvestigatorSlotJson,
  generatedAt = new Date().toISOString()
): InvestigatorReportJson {
  const sections: InvestigatorReportSection[] = slotJson.bundles.map((bundle) => ({
    sectionTitle: buildSectionTitle(bundle),
    entries: [
      { label: "canonicalDate", value: bundle.canonicalDate },
      { label: "hospital", value: bundle.hospital },
      { label: "department", value: bundle.department },
      { label: "diagnosis", value: bundle.diagnosis },
      { label: "test", value: bundle.test },
      { label: "treatment", value: bundle.treatment },
      { label: "procedure", value: bundle.procedure },
      { label: "surgery", value: bundle.surgery },
      { label: "admissionStatus", value: bundle.admissionStatus },
      { label: "pathologySummary", value: bundle.pathologySummary },
      { label: "medicationSummary", value: bundle.medicationSummary },
      { label: "symptomSummary", value: bundle.symptomSummary },
      { label: "bundleTypeCandidate", value: bundle.bundleTypeCandidate },
      { label: "ambiguityScore", value: String(bundle.ambiguityScore) },
      { label: "bundleQualityState", value: bundle.bundleQualityGate.bundleQualityState }
    ],
    bundleQualityState: bundle.bundleQualityGate.bundleQualityState,
    reviewSignalSummary: buildReviewSignalSummary(bundle),
    requiresReview: bundle.requiresReview,
    notes: [...bundle.notes]
  }));

  return investigatorReportJsonSchema.parse({
    caseId,
    generatedAt,
    sections,
    requiresReview: sections.some((section) => section.requiresReview)
  });
}
