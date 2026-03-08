import { describe, expect, it } from "vitest";
import { buildConsumerStructuredOutput } from "./consumer-summary-builder";

describe("consumer summary builder", () => {
  it("maps EventBundles into consumer summary JSON in date order", () => {
    const output = buildConsumerStructuredOutput("case-1", [
      {
        id: "bundle-2",
        caseId: "case-1",
        canonicalDate: "2024-03-08",
        fileOrder: 1,
        pageOrder: 2,
        primaryHospital: "Seoul Hospital",
        bundleTypeCandidate: "surgery",
        representativeDiagnosis: "Gallbladder disease",
        representativeTest: null,
        representativeTreatment: null,
        representativeProcedure: null,
        representativeSurgery: "Resection",
        admissionStatus: null,
        ambiguityScore: 0.35,
        requiresReview: false,
        unresolvedBundleSlotsJson: {
          hospitalConflict: false,
          diagnosisConflict: false,
          mixedAtomTypes: false,
          weakGrouping: false,
          needsManualReview: false,
          notes: []
        },
        atomIdsJson: ["atom-2"],
        candidateSnapshotJson: {
          hospitals: ["Seoul Hospital"],
          departments: [],
          diagnoses: ["Gallbladder disease"],
          tests: [],
          treatments: [],
          procedures: [],
          surgeries: ["Resection"],
          admissions: [],
          discharges: [],
          pathologies: [],
          medications: [],
          symptoms: []
        },
        createdAt: "2026-03-08T00:00:00.000Z"
      },
      {
        id: "bundle-1",
        caseId: "case-1",
        canonicalDate: "2024-03-07",
        fileOrder: 1,
        pageOrder: 1,
        primaryHospital: "Seoul Hospital",
        bundleTypeCandidate: "exam",
        representativeDiagnosis: "Pneumonia",
        representativeTest: "CT",
        representativeTreatment: null,
        representativeProcedure: null,
        representativeSurgery: null,
        admissionStatus: null,
        ambiguityScore: 0.2,
        requiresReview: true,
        unresolvedBundleSlotsJson: {
          hospitalConflict: false,
          diagnosisConflict: false,
          mixedAtomTypes: false,
          weakGrouping: false,
          needsManualReview: true,
          notes: ["needs review"]
        },
        atomIdsJson: ["atom-1"],
        candidateSnapshotJson: {
          hospitals: ["Seoul Hospital"],
          departments: [],
          diagnoses: ["Pneumonia"],
          tests: ["CT"],
          treatments: [],
          procedures: [],
          surgeries: [],
          admissions: [],
          discharges: [],
          pathologies: [],
          medications: [],
          symptoms: []
        },
        createdAt: "2026-03-08T00:00:00.000Z"
      }
    ], "2026-03-08T00:00:00.000Z");

    expect(output.timelineSummary[0]?.canonicalDate).toBe("2024-03-07");
    expect(output.hospitalSummary).toEqual(["Seoul Hospital"]);
    expect(output.riskSignals).toContain("review_required_bundle");
    expect(output.riskSignals).toContain("surgery_bundle_detected");
    expect(output.checkPoints).toContain("review_required_bundle_exists");
    expect(output.recommendedNextActions).toContain("check_surgery_records");
    expect(output.requiresReview).toBe(true);
  });

  it("keeps null slots and only emits enum-style signals", () => {
    const output = buildConsumerStructuredOutput("case-1", [
      {
        id: "bundle-1",
        caseId: "case-1",
        canonicalDate: "2024-03-09",
        fileOrder: 1,
        pageOrder: 1,
        primaryHospital: null,
        bundleTypeCandidate: "unknown",
        representativeDiagnosis: null,
        representativeTest: null,
        representativeTreatment: null,
        representativeProcedure: null,
        representativeSurgery: null,
        admissionStatus: "both",
        ambiguityScore: 0.8,
        requiresReview: true,
        unresolvedBundleSlotsJson: {
          hospitalConflict: false,
          diagnosisConflict: false,
          mixedAtomTypes: true,
          weakGrouping: true,
          needsManualReview: true,
          notes: ["review"]
        },
        atomIdsJson: ["atom-1"],
        candidateSnapshotJson: {
          hospitals: [],
          departments: [],
          diagnoses: [],
          tests: [],
          treatments: [],
          procedures: [],
          surgeries: [],
          admissions: ["admitted"],
          discharges: ["discharged"],
          pathologies: [],
          medications: [],
          symptoms: []
        },
        createdAt: "2026-03-08T00:00:00.000Z"
      }
    ], "2026-03-08T00:00:00.000Z");

    expect(output.timelineSummary[0]?.hospital).toBeNull();
    expect(output.timelineSummary[0]?.reviewFlag).toBe(true);
    expect(output.checkPoints).toContain("mixed_bundle_detected");
    expect(output.recommendedNextActions).toContain("manual_review_recommended");
  });
});
