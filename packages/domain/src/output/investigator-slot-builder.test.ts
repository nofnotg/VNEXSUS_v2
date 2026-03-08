import { describe, expect, it } from "vitest";
import { buildInvestigatorStructuredOutput } from "./investigator-slot-builder";

describe("investigator slot builder", () => {
  it("maps EventBundles into investigator slot bundles", () => {
    const output = buildInvestigatorStructuredOutput("case-1", [
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
        ambiguityScore: 0.22,
        requiresReview: false,
        unresolvedBundleSlotsJson: {
          hospitalConflict: false,
          diagnosisConflict: false,
          mixedAtomTypes: false,
          weakGrouping: false,
          needsManualReview: false,
          notes: []
        },
        atomIdsJson: ["atom-1"],
        candidateSnapshotJson: {
          hospitals: ["Seoul Hospital"],
          departments: ["Internal Medicine"],
          diagnoses: ["Pneumonia"],
          tests: ["CT"],
          treatments: [],
          procedures: [],
          surgeries: [],
          admissions: [],
          discharges: [],
          pathologies: [],
          medications: ["Aspirin"],
          symptoms: ["Cough"]
        },
        createdAt: "2026-03-08T00:00:00.000Z"
      }
    ], "2026-03-08T00:00:00.000Z");

    expect(output.caseId).toBe("case-1");
    expect(output.bundles).toHaveLength(1);
    expect(output.bundles[0]?.hospital).toBe("Seoul Hospital");
    expect(output.bundles[0]?.department).toBe("Internal Medicine");
    expect(output.bundles[0]?.medicationSummary).toBe("Aspirin");
    expect(output.bundles[0]?.notes).toEqual([]);
  });

  it("preserves null slots and unresolved notes", () => {
    const output = buildInvestigatorStructuredOutput("case-1", [
      {
        id: "bundle-1",
        caseId: "case-1",
        canonicalDate: "2024-03-08",
        fileOrder: 1,
        pageOrder: 2,
        primaryHospital: null,
        bundleTypeCandidate: "mixed",
        representativeDiagnosis: null,
        representativeTest: null,
        representativeTreatment: null,
        representativeProcedure: null,
        representativeSurgery: null,
        admissionStatus: "both",
        ambiguityScore: 0.77,
        requiresReview: true,
        unresolvedBundleSlotsJson: {
          hospitalConflict: false,
          diagnosisConflict: true,
          mixedAtomTypes: true,
          weakGrouping: true,
          needsManualReview: true,
          notes: ["bundle ambiguity exceeds provisional threshold"]
        },
        atomIdsJson: ["atom-2"],
        candidateSnapshotJson: {
          hospitals: [],
          departments: ["Internal Medicine", "Radiology"],
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

    expect(output.bundles[0]?.hospital).toBeNull();
    expect(output.bundles[0]?.department).toBeNull();
    expect(output.bundles[0]?.requiresReview).toBe(true);
    expect(output.bundles[0]?.notes).toEqual(["bundle ambiguity exceeds provisional threshold"]);
  });
});
