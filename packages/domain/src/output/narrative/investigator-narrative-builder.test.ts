import { describe, expect, it } from "vitest";
import { buildInvestigatorNarrative } from "./investigator-narrative-builder";

describe("buildInvestigatorNarrative", () => {
  it("renders review-required narrative text with explicit structured review signals", () => {
    const narrative = buildInvestigatorNarrative({
      caseId: "case-1",
      generatedAt: "2026-03-08T00:00:00.000Z",
      requiresReview: true,
      sections: [
        {
          sectionTitle: "2024-03-07 | exam",
          entries: [
            { label: "canonicalDate", value: "2024-03-07" },
            { label: "hospital", value: "Seoul Hospital" },
            { label: "department", value: "Internal Medicine" },
            { label: "diagnosis", value: "Pneumonia" },
            { label: "test", value: "CT" },
            { label: "medicationSummary", value: "Aspirin" }
          ],
          bundleQualityState: "review_required",
          reviewSignalSummary: ["bundleQualityState=review_required"],
          requiresReview: true,
          notes: ["weak evidence"]
        }
      ]
    });

    expect(narrative.caseId).toBe("case-1");
    expect(narrative.requiresReview).toBe(true);
    expect(narrative.sections[0]?.heading).toBe("2024-03-07 | exam");
    expect(narrative.sections[0]?.bundleQualityState).toBe("review_required");
    expect(narrative.sections[0]?.paragraphs[0]).toContain("On 2024-03-07");
    expect(narrative.sections[0]?.paragraphs[0]).toContain("Seoul Hospital");
    expect(narrative.sections[0]?.paragraphs[1]).toContain("Structured review signal: additional review is required.");
    expect(narrative.sections[0]?.paragraphs[1]).toContain("Review notes");
  });

  it("preserves insufficient quality signals even without explicit notes", () => {
    const narrative = buildInvestigatorNarrative({
      caseId: "case-2",
      generatedAt: "2026-03-08T00:00:00.000Z",
      requiresReview: true,
      sections: [
        {
          sectionTitle: "2024-04-01 | mixed",
          entries: [
            { label: "canonicalDate", value: "2024-04-01" },
            { label: "hospital", value: null },
            { label: "diagnosis", value: null }
          ],
          bundleQualityState: "insufficient",
          reviewSignalSummary: ["bundleQualityState=insufficient"],
          requiresReview: true,
          notes: []
        }
      ]
    });

    expect(narrative.requiresReview).toBe(true);
    expect(narrative.sections[0]?.requiresReview).toBe(true);
    expect(narrative.sections[0]?.bundleQualityState).toBe("insufficient");
    expect(narrative.sections[0]?.paragraphs).toHaveLength(2);
    expect(narrative.sections[0]?.paragraphs[1]).toContain(
      "Structured review signal: bundle evidence is insufficient."
    );
  });

  it("renders Korean review-signal text when lang is ko", () => {
    const narrative = buildInvestigatorNarrative(
      {
        caseId: "case-3",
        generatedAt: "2026-03-08T00:00:00.000Z",
        requiresReview: true,
        sections: [
          {
            sectionTitle: "2024-05-10 | treatment",
            entries: [
              { label: "canonicalDate", value: "2024-05-10" },
              { label: "hospital", value: "서울병원" },
              { label: "diagnosis", value: "염증" }
            ],
            bundleQualityState: "review_required",
            reviewSignalSummary: ["bundleQualityState=review_required"],
            requiresReview: true,
            notes: ["추가 검토"]
          }
        ]
      },
      "ko"
    );

    expect(narrative.sections[0]?.paragraphs[0]).toContain("2024-05-10");
    expect(narrative.sections[0]?.paragraphs[0]).toContain("서울병원");
    expect(narrative.sections[0]?.paragraphs[1]).toContain("구조화 검토 신호");
    expect(narrative.sections[0]?.paragraphs[1]).toContain("검토 메모");
  });
});
