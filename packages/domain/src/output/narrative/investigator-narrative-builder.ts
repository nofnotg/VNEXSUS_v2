import {
  investigatorNarrativeJsonSchema,
  type InvestigatorNarrativeJson,
  type InvestigatorReportJson,
  type InvestigatorReportSection
} from "@vnexus/shared";

function getEntryValue(section: InvestigatorReportSection, label: string) {
  return section.entries.find((entry) => entry.label === label)?.value ?? null;
}

function joinNarrativeParts(parts: Array<string | null | undefined>) {
  return parts.filter((part): part is string => Boolean(part && part.trim().length > 0)).join(" ");
}

function buildSummaryParagraph(section: InvestigatorReportSection) {
  const canonicalDate = getEntryValue(section, "canonicalDate");
  const hospital = getEntryValue(section, "hospital");
  const department = getEntryValue(section, "department");
  const diagnosis = getEntryValue(section, "diagnosis");
  const test = getEntryValue(section, "test");
  const treatment = getEntryValue(section, "treatment");
  const procedure = getEntryValue(section, "procedure");
  const surgery = getEntryValue(section, "surgery");
  const pathologySummary = getEntryValue(section, "pathologySummary");
  const medicationSummary = getEntryValue(section, "medicationSummary");
  const symptomSummary = getEntryValue(section, "symptomSummary");

  const eventDetails = [diagnosis, test, treatment, procedure, surgery].filter(
    (value): value is string => Boolean(value && value.trim().length > 0)
  );

  const eventText =
    eventDetails.length > 0 ? `${eventDetails.join(", ")} was documented.` : "Key medical details need manual review.";

  return joinNarrativeParts([
    canonicalDate ? `On ${canonicalDate},` : null,
    hospital ? `at ${hospital},` : "with no confirmed facility,",
    department ? `within ${department},` : null,
    eventText,
    pathologySummary ? `Pathology summary: ${pathologySummary}.` : null,
    medicationSummary ? `Medication summary: ${medicationSummary}.` : null,
    symptomSummary ? `Symptom summary: ${symptomSummary}.` : null
  ]);
}

function buildReviewParagraph(section: InvestigatorReportSection) {
  const notes = section.notes.filter((note) => note.trim().length > 0);

  if (!section.requiresReview && notes.length === 0) {
    return null;
  }

  if (notes.length === 0) {
    return "This section requires manual review.";
  }

  return `Review notes: ${notes.join("; ")}.`;
}

export function buildInvestigatorNarrative(report: InvestigatorReportJson): InvestigatorNarrativeJson {
  return investigatorNarrativeJsonSchema.parse({
    caseId: report.caseId,
    generatedAt: report.generatedAt,
    requiresReview: report.requiresReview,
    sections: report.sections.map((section) => ({
      heading: section.sectionTitle,
      paragraphs: [buildSummaryParagraph(section), buildReviewParagraph(section)].filter(
        (paragraph): paragraph is string => Boolean(paragraph && paragraph.trim().length > 0)
      ),
      requiresReview: section.requiresReview
    }))
  });
}
