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
    eventDetails.length > 0 ? `${eventDetails.join(", ")} 관련 기록이 확인되었다.` : "핵심 의료 행위는 추가 검토가 필요하다.";

  return joinNarrativeParts([
    canonicalDate ? `${canonicalDate}에` : null,
    hospital ? `${hospital}에서` : "의료기관 정보 없이",
    department ? `${department} 진료 맥락으로` : null,
    eventText,
    pathologySummary ? `병리 요약은 ${pathologySummary}로 정리되었다.` : null,
    medicationSummary ? `투약 요약은 ${medicationSummary}이다.` : null,
    symptomSummary ? `증상 메모는 ${symptomSummary}이다.` : null
  ]);
}

function buildReviewParagraph(section: InvestigatorReportSection) {
  const notes = section.notes.filter((note) => note.trim().length > 0);

  if (!section.requiresReview && notes.length === 0) {
    return null;
  }

  if (notes.length === 0) {
    return "이 섹션은 수기 검토가 필요하다.";
  }

  return `검토 메모: ${notes.join("; ")}.`;
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
