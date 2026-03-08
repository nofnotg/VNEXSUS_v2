import { describe, expect, it, vi } from "vitest";

vi.mock("./consumer-output-service", () => ({
  getConsumerStructuredOutput: vi.fn(async () => ({
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
  }))
}));

import { getConsumerReport } from "./consumer-report-service";

describe("consumer report service", () => {
  it("renders consumer structured output into report JSON", async () => {
    const report = await getConsumerReport("case-1", "user-1", "consumer");

    expect(report.caseId).toBe("case-1");
    expect(report.sections[0]?.sectionTitle).toBe("timeline_summary");
    expect(report.sections[1]?.checkPoints).toEqual(["review_required_bundle_exists"]);
    expect(report.requiresReview).toBe(true);
  });
});
