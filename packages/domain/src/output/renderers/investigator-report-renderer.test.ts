import { describe, expect, it } from "vitest";
import { buildInvestigatorReport } from "./investigator-report-renderer";

describe("investigator report renderer", () => {
  it("renders supported bundles without extra review summary noise", () => {
    const report = buildInvestigatorReport(
      "case-1",
      {
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
            bundleTypeCandidate: "exam",
            ambiguityScore: 0.2,
            requiresReview: false,
            bundleQualityGate: {
              bundleQualityState: "supported",
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
                weakGrouping: false,
                needsManualReview: false
              }
            },
            notes: []
          }
        ]
      },
      "2026-03-08T00:00:00.000Z"
    );

    expect(report.caseId).toBe("case-1");
    expect(report.sections).toHaveLength(1);
    expect(report.sections[0]?.sectionTitle).toBe("2024-03-07 | exam");
    expect(report.sections[0]?.entries[1]).toEqual({ label: "hospital", value: "Seoul Hospital" });
    expect(report.sections[0]?.bundleQualityState).toBe("supported");
    expect(report.sections[0]?.reviewSignalSummary).toEqual([]);
    expect(report.requiresReview).toBe(false);
  });

  it("propagates review-required quality signals and unresolved flags", () => {
    const report = buildInvestigatorReport(
      "case-1",
      {
        caseId: "case-1",
        generatedAt: "2026-03-08T00:00:00.000Z",
        bundles: [
          {
            eventBundleId: "bundle-2",
            canonicalDate: "2024-03-08",
            hospital: null,
            department: null,
            diagnosis: null,
            test: null,
            treatment: null,
            procedure: null,
            surgery: null,
            admissionStatus: "both",
            pathologySummary: null,
            medicationSummary: null,
            symptomSummary: null,
            bundleTypeCandidate: "mixed",
            ambiguityScore: 0.8,
            requiresReview: true,
            bundleQualityGate: {
              bundleQualityState: "review_required",
              evidenceAnchors: {
                hospital: false,
                department: false,
                diagnosis: false,
                test: false,
                treatment: false,
                procedure: false,
                surgery: false,
                pathology: false,
                admissionOrDischarge: true
              },
              unresolvedFlags: {
                hospitalConflict: false,
                diagnosisConflict: false,
                mixedAtomTypes: true,
                weakGrouping: true,
                needsManualReview: true
              }
            },
            notes: ["bundle ambiguity exceeds provisional threshold"]
          }
        ]
      },
      "2026-03-08T00:00:00.000Z"
    );

    expect(report.sections[0]?.requiresReview).toBe(true);
    expect(report.sections[0]?.bundleQualityState).toBe("review_required");
    expect(report.sections[0]?.reviewSignalSummary).toEqual([
      "bundleQualityState=review_required",
      "unresolvedFlags=mixedAtomTypes,weakGrouping,needsManualReview"
    ]);
    expect(report.sections[0]?.notes).toEqual(["bundle ambiguity exceeds provisional threshold"]);
    expect(report.requiresReview).toBe(true);
  });
});
