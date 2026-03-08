import {
  consumerReportJsonSchema,
  type ConsumerReportJson,
  type ConsumerReportSection,
  type ConsumerSummaryJson
} from "@vnexus/shared";

export function buildConsumerReport(
  caseId: string,
  summaryJson: ConsumerSummaryJson,
  generatedAt = new Date().toISOString()
): ConsumerReportJson {
  const timelineSection: ConsumerReportSection = {
    sectionTitle: "timeline_summary",
    summaryItems: summaryJson.timelineSummary.map((item) => ({
      title: [item.canonicalDate, item.hospital ?? "unknown_hospital"].join(" | "),
      value: [item.diagnosis, item.test, item.treatment, item.surgery, item.admissionStatus]
        .filter((value): value is string => Boolean(value))
        .join(" / ") || null
    })),
    riskSignals: [],
    checkPoints: [],
    nextActions: [],
    requiresReview: summaryJson.timelineSummary.some((item) => item.reviewFlag)
  };

  const overviewSection: ConsumerReportSection = {
    sectionTitle: "consumer_overview",
    summaryItems: [
      {
        title: "hospitalSummary",
        value: summaryJson.hospitalSummary.length > 0 ? summaryJson.hospitalSummary.join(", ") : null
      }
    ],
    riskSignals: [...summaryJson.riskSignals],
    checkPoints: [...summaryJson.checkPoints],
    nextActions: [...summaryJson.recommendedNextActions],
    requiresReview: summaryJson.requiresReview
  };

  return consumerReportJsonSchema.parse({
    caseId,
    generatedAt,
    sections: [timelineSection, overviewSection],
    requiresReview: summaryJson.requiresReview
  });
}
