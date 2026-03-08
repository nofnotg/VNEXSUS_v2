import {
  formatMessage,
  investigatorNarrativeJsonSchema,
  messages,
  type LocaleCode,
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

function buildSummaryParagraph(section: InvestigatorReportSection, lang: LocaleCode) {
  const locale = messages[lang];
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

  const eventText = eventDetails.length > 0 ? eventDetails.join(", ") : locale.investigatorNoKeyDetails;
  const summaryBase = formatMessage(locale.investigatorSummaryTemplate, {
    date: canonicalDate ?? locale.investigatorUnknownDate,
    hospital: hospital ?? locale.investigatorUnknownFacility,
    departmentClause: department ? (lang === "ko" ? ` ${department}` : `, within ${department}`) : "",
    details: eventText
  }).replace(/\s{2,}/g, " ").replace(/\s+\./g, ".").trim();

  return joinNarrativeParts([
    summaryBase,
    pathologySummary ? formatMessage(locale.investigatorPathology, { value: pathologySummary }) : null,
    medicationSummary ? formatMessage(locale.investigatorMedication, { value: medicationSummary }) : null,
    symptomSummary ? formatMessage(locale.investigatorSymptom, { value: symptomSummary }) : null
  ]);
}

function buildReviewParagraph(section: InvestigatorReportSection, lang: LocaleCode) {
  const locale = messages[lang];
  const notes = section.notes.filter((note) => note.trim().length > 0);

  if (!section.requiresReview && notes.length === 0) {
    return null;
  }

  if (notes.length === 0) {
    return locale.investigatorReviewRequired;
  }

  return formatMessage(locale.investigatorReviewNotes, { notes: notes.join("; ") });
}

export function buildInvestigatorNarrative(
  report: InvestigatorReportJson,
  lang: LocaleCode = "en"
): InvestigatorNarrativeJson {
  return investigatorNarrativeJsonSchema.parse({
    caseId: report.caseId,
    generatedAt: report.generatedAt,
    requiresReview: report.requiresReview,
    sections: report.sections.map((section) => ({
      heading: section.sectionTitle,
      paragraphs: [buildSummaryParagraph(section, lang), buildReviewParagraph(section, lang)].filter(
        (paragraph): paragraph is string => Boolean(paragraph && paragraph.trim().length > 0)
      ),
      requiresReview: section.requiresReview
    }))
  });
}
