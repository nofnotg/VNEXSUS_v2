import { describe, expect, it, vi } from "vitest";

vi.mock("./investigator-output-service", () => ({
  getInvestigatorStructuredOutput: vi.fn(async () => ({
    caseId: "case-1",
    generatedAt: "2026-03-08T00:00:00.000Z",
    bundles: [
      {
        eventBundleId: "bundle-1",
        canonicalDate: "2024-03-07",
        hospital: "Seoul Hospital",
        department: "Internal Medicine",
        diagnosis: "Pneumonia",
        test: "CT",
        treatment: null,
        procedure: null,
        surgery: null,
        admissionStatus: null,
        pathologySummary: null,
        medicationSummary: "Aspirin",
        symptomSummary: "Cough",
        bundleTypeCandidate: "exam" as const,
        ambiguityScore: 0.2,
        requiresReview: false,
        notes: []
      }
    ]
  }))
}));

import { getInvestigatorReport } from "./investigator-report-service";

describe("investigator report service", () => {
  it("renders investigator structured output into report JSON", async () => {
    const report = await getInvestigatorReport("case-1", "user-1", "investigator");

    expect(report.caseId).toBe("case-1");
    expect(report.sections[0]?.sectionTitle).toBe("2024-03-07 | exam");
    expect(report.sections[0]?.entries[1]?.value).toBe("Seoul Hospital");
    expect(report.requiresReview).toBe(false);
  });
});
