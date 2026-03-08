import { describe, expect, it } from "vitest";
import { buildConsumerNarrative } from "./consumer-narrative-builder";

describe("buildConsumerNarrative", () => {
  it("renders timeline and overview paragraphs from consumer report sections", () => {
    const narrative = buildConsumerNarrative({
      caseId: "case-1",
      generatedAt: "2026-03-08T00:00:00.000Z",
      requiresReview: true,
      sections: [
        {
          sectionTitle: "timeline_summary",
          summaryItems: [{ title: "2024-03-07 | Seoul Hospital", value: "Pneumonia / CT" }],
          riskSignals: [],
          checkPoints: [],
          nextActions: [],
          requiresReview: false
        },
        {
          sectionTitle: "consumer_overview",
          summaryItems: [{ title: "hospitalSummary", value: "Seoul Hospital" }],
          riskSignals: ["review_required_bundle"],
          checkPoints: ["review_required_bundle_exists"],
          nextActions: ["review_original_documents"],
          requiresReview: true
        }
      ]
    });

    expect(narrative.caseId).toBe("case-1");
    expect(narrative.sections[0]?.paragraphs[0]).toContain("2024-03-07");
    expect(narrative.sections[1]?.paragraphs.join(" ")).toContain("review_required_bundle_exists");
    expect(narrative.requiresReview).toBe(true);
  });

  it("provides empty-state text when overview content is missing", () => {
    const narrative = buildConsumerNarrative({
      caseId: "case-2",
      generatedAt: "2026-03-08T00:00:00.000Z",
      requiresReview: false,
      sections: [
        {
          sectionTitle: "consumer_overview",
          summaryItems: [],
          riskSignals: [],
          checkPoints: [],
          nextActions: [],
          requiresReview: false
        }
      ]
    });

    expect(narrative.sections[0]?.paragraphs[0]).toContain("표시할 소비자용 요약 정보가 아직 없다");
  });
});
