import {
  consumerNarrativeJsonSchema,
  type ConsumerNarrativeJson,
  type ConsumerReportJson,
  type ConsumerReportSection
} from "@vnexus/shared";

function buildTimelineParagraphs(section: ConsumerReportSection) {
  if (section.summaryItems.length === 0) {
    return ["확인 가능한 타임라인 요약이 아직 없다."];
  }

  return section.summaryItems.map((item) => {
    const [datePart, hospitalPart] = item.title.split("|").map((part) => part.trim());
    const dateText = datePart || "기록 시점 미상";
    const hospitalText = hospitalPart || "의료기관 미상";
    const valueText = item.value?.trim();

    return valueText
      ? `${dateText}에 ${hospitalText} 관련 기록으로 ${valueText}이 확인되었다.`
      : `${dateText}에 ${hospitalText} 방문 기록이 확인되었다.`;
  });
}

function buildOverviewParagraphs(section: ConsumerReportSection) {
  const paragraphs: string[] = [];

  if (section.summaryItems.length > 0) {
    const summary = section.summaryItems
      .map((item) => `${item.title}: ${item.value ?? "정보 없음"}`)
      .join("; ");
    paragraphs.push(`핵심 요약은 ${summary}이다.`);
  }

  if (section.riskSignals.length > 0) {
    paragraphs.push(`주의 신호는 ${section.riskSignals.join(", ")}이다.`);
  }

  if (section.checkPoints.length > 0) {
    paragraphs.push(`추가 확인 항목은 ${section.checkPoints.join(", ")}이다.`);
  }

  if (section.nextActions.length > 0) {
    paragraphs.push(`권장 다음 단계는 ${section.nextActions.join(", ")}이다.`);
  }

  if (paragraphs.length === 0) {
    paragraphs.push("표시할 소비자용 요약 정보가 아직 없다.");
  }

  return paragraphs;
}

export function buildConsumerNarrative(report: ConsumerReportJson): ConsumerNarrativeJson {
  return consumerNarrativeJsonSchema.parse({
    caseId: report.caseId,
    generatedAt: report.generatedAt,
    requiresReview: report.requiresReview,
    sections: report.sections.map((section) => ({
      heading: section.sectionTitle,
      paragraphs:
        section.sectionTitle === "timeline_summary" ? buildTimelineParagraphs(section) : buildOverviewParagraphs(section),
      requiresReview: section.requiresReview
    }))
  });
}
