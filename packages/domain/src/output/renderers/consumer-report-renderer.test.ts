import { describe, expect, it } from "vitest";
import { buildConsumerReport } from "./consumer-report-renderer";

describe("consumer report renderer", () => {
  it("renders summary JSON into report sections", () => {
    const report = buildConsumerReport(
      "case-1",
      {
        caseId: "case-1",
        generatedAt: "2026-03-08T00:00:00.000Z",
        timelineSummary: [
          {
            canonicalDate: "2024-03-07",
            hospital: "Seoul Hospital",
            diagnosis: "Pneumonia",
            test: "CT",
            treatment: null,
            surgery: null,
            admissionStatus: null,
            reviewFlag: false
          }
        ],
        hospitalSummary: ["Seoul Hospital"],
        riskSignals: ["review_required_bundle"],
        checkPoints: ["review_required_bundle_exists"],
        recommendedNextActions: ["review_original_documents"],
        requiresReview: true
      },
      "2026-03-08T00:00:00.000Z"
    );

    expect(report.caseId).toBe("case-1");
    expect(report.sections).toHaveLength(2);
    expect(report.sections[0]?.sectionTitle).toBe("timeline_summary");
    expect(report.sections[1]?.riskSignals).toEqual(["review_required_bundle"]);
    expect(report.requiresReview).toBe(true);
  });

  it("keeps section-level requiresReview and summary items stable", () => {
    const report = buildConsumerReport(
      "case-1",
      {
        caseId: "case-1",
        generatedAt: "2026-03-08T00:00:00.000Z",
        timelineSummary: [
          {
            canonicalDate: "2024-03-08",
            hospital: null,
            diagnosis: null,
            test: null,
            treatment: null,
            surgery: "Resection",
            admissionStatus: "both",
            reviewFlag: true
          }
        ],
        hospitalSummary: [],
        riskSignals: [],
        checkPoints: [],
        recommendedNextActions: [],
        requiresReview: true
      },
      "2026-03-08T00:00:00.000Z"
    );

    expect(report.sections[0]?.summaryItems[0]?.title).toBe("2024-03-08 | unknown_hospital");
    expect(report.sections[0]?.requiresReview).toBe(true);
    expect(report.sections[1]?.summaryItems[0]?.value).toBeNull();
  });
});
