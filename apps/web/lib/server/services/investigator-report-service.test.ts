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
        requiresReview: true,
        bundleQualityGate: {
          bundleQualityState: "review_required" as const,
          evidenceAnchors: {
            hospital: true,
            department: true,
            diagnosis: true,
            test: true,
            treatment: false,
            procedure: false,
            surgery: false,
            pathology: false,
            admissionOrDischarge: false
          },
          unresolvedFlags: {
            hospitalConflict: false,
            diagnosisConflict: false,
            mixedAtomTypes: false,
            weakGrouping: true,
            needsManualReview: true
          }
        },
        notes: []
      }
    ]
  }))
}));

import { getInvestigatorReport } from "./investigator-report-service";

describe("investigator report service", () => {
  it("keeps bundle quality and review signals in report JSON", async () => {
    const report = await getInvestigatorReport("case-1", "user-1", "investigator");

    expect(report.caseId).toBe("case-1");
    expect(report.sections[0]?.sectionTitle).toBe("2024-03-07 | exam");
    expect(report.sections[0]?.entries[1]?.value).toBe("Seoul Hospital");
    expect(report.sections[0]?.bundleQualityState).toBe("review_required");
    expect(report.sections[0]?.reviewSignalSummary).toEqual([
      "bundleQualityState=review_required",
      "unresolvedFlags=weakGrouping,needsManualReview"
    ]);
    expect(report.requiresReview).toBe(true);
  });
});
