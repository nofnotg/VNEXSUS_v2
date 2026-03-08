import {
  consumerNarrativeJsonSchema,
  type ConsumerNarrativeJson,
  type ConsumerReportJson,
  type ConsumerReportSection
} from "@vnexus/shared";

function buildTimelineParagraphs(section: ConsumerReportSection) {
  if (section.summaryItems.length === 0) {
    return ["No confirmed timeline summary is available yet."];
  }

  return section.summaryItems.map((item) => {
    const [datePart, hospitalPart] = item.title.split("|").map((part) => part.trim());
    const dateText = datePart || "unknown date";
    const hospitalText = hospitalPart || "unknown facility";
    const valueText = item.value?.trim();

    return valueText
      ? `On ${dateText}, records from ${hospitalText} show ${valueText}.`
      : `On ${dateText}, a visit record from ${hospitalText} was identified.`;
  });
}

function buildOverviewParagraphs(section: ConsumerReportSection) {
  const paragraphs: string[] = [];

  if (section.summaryItems.length > 0) {
    const summary = section.summaryItems
      .map((item) => `${item.title}: ${item.value ?? "no data"}`)
      .join("; ");
    paragraphs.push(`Summary: ${summary}.`);
  }

  if (section.riskSignals.length > 0) {
    paragraphs.push(`Risk signals: ${section.riskSignals.join(", ")}.`);
  }

  if (section.checkPoints.length > 0) {
    paragraphs.push(`Check points: ${section.checkPoints.join(", ")}.`);
  }

  if (section.nextActions.length > 0) {
    paragraphs.push(`Recommended next actions: ${section.nextActions.join(", ")}.`);
  }

  if (paragraphs.length === 0) {
    paragraphs.push("No consumer summary details are available yet.");
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
