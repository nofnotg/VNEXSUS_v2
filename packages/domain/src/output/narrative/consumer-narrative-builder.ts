import {
  consumerNarrativeJsonSchema,
  formatMessage,
  messages,
  type LocaleCode,
  type ConsumerNarrativeJson,
  type ConsumerReportJson,
  type ConsumerReportSection
} from "@vnexus/shared";

function buildTimelineParagraphs(section: ConsumerReportSection, lang: LocaleCode) {
  const locale = messages[lang];

  if (section.summaryItems.length === 0) {
    return [locale.noTimeline];
  }

  return section.summaryItems.map((item) => {
    const [datePart, hospitalPart] = item.title.split("|").map((part) => part.trim());
    const dateText = datePart || locale.genericUnknownDate;
    const hospitalText = hospitalPart || locale.genericUnknownFacility;
    const valueText = item.value?.trim();

    return valueText
      ? formatMessage(locale.timelineDetail, { date: dateText, hospital: hospitalText, value: valueText })
      : formatMessage(locale.timelineRecord, { date: dateText, hospital: hospitalText });
  });
}

function buildOverviewParagraphs(section: ConsumerReportSection, lang: LocaleCode) {
  const locale = messages[lang];
  const paragraphs: string[] = [];

  if (section.summaryItems.length > 0) {
    const summary = section.summaryItems
      .map((item) => `${item.title}: ${item.value ?? locale.genericNoData}`)
      .join("; ");
    paragraphs.push(formatMessage(locale.summaryIntro, { summary }));
  }

  if (section.riskSignals.length > 0) {
    paragraphs.push(formatMessage(locale.riskSignals, { signals: section.riskSignals.join(", ") }));
  }

  if (section.checkPoints.length > 0) {
    paragraphs.push(formatMessage(locale.checkPoints, { points: section.checkPoints.join(", ") }));
  }

  if (section.nextActions.length > 0) {
    paragraphs.push(formatMessage(locale.nextActions, { actions: section.nextActions.join(", ") }));
  }

  if (paragraphs.length === 0) {
    paragraphs.push(locale.noSummary);
  }

  return paragraphs;
}

export function buildConsumerNarrative(report: ConsumerReportJson, lang: LocaleCode = "en"): ConsumerNarrativeJson {
  return consumerNarrativeJsonSchema.parse({
    caseId: report.caseId,
    generatedAt: report.generatedAt,
    requiresReview: report.requiresReview,
    sections: report.sections.map((section) => ({
      heading: section.sectionTitle,
      paragraphs:
        section.sectionTitle === "timeline_summary"
          ? buildTimelineParagraphs(section, lang)
          : buildOverviewParagraphs(section, lang),
      requiresReview: section.requiresReview
    }))
  });
}
