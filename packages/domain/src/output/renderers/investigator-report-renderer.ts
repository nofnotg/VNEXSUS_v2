import {
  investigatorReportJsonSchema,
  type InvestigatorReportJson,
  type InvestigatorReportSection,
  type InvestigatorSlotJson
} from "@vnexus/shared";

function buildSectionTitle(bundle: InvestigatorSlotJson["bundles"][number]) {
  return [bundle.canonicalDate, bundle.bundleTypeCandidate].join(" | ");
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
      { label: "ambiguityScore", value: String(bundle.ambiguityScore) }
    ],
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
