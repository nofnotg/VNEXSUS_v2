import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  bundles: [
    {
      id: "bundle-2",
      caseId: "case-1",
      canonicalDate: "2024-03-08",
      fileOrder: 1,
      pageOrder: 2,
      primaryHospital: null,
      bundleTypeCandidate: "mixed" as const,
      representativeDiagnosis: null,
      representativeTest: null,
      representativeTreatment: null,
      representativeProcedure: null,
      representativeSurgery: null,
      admissionStatus: "both" as const,
      ambiguityScore: 0.8,
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
      createdAt: new Date("2026-03-08T00:00:01.000Z")
    },
    {
      id: "bundle-1",
      caseId: "case-1",
      canonicalDate: "2024-03-07",
      fileOrder: 1,
      pageOrder: 1,
      primaryHospital: "Seoul Hospital",
      bundleTypeCandidate: "exam" as const,
      representativeDiagnosis: "Pneumonia",
      representativeTest: "CT",
      representativeTreatment: null,
      representativeProcedure: null,
      representativeSurgery: null,
      admissionStatus: null,
      ambiguityScore: 0.2,
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
      createdAt: new Date("2026-03-08T00:00:00.000Z")
    }
  ]
}));

vi.mock("../../prisma", () => ({
  prisma: {
    eventBundle: {
      findMany: vi.fn(async () => [...state.bundles])
    }
  }
}));

vi.mock("./case-service", () => ({
  getCaseForUser: vi.fn(async () => ({ id: "case-1" }))
}));

import { getInvestigatorStructuredOutput } from "./investigator-output-service";

describe("investigator output service", () => {
  it("builds investigator structured output from EventBundles", async () => {
    const result = await getInvestigatorStructuredOutput("case-1", "user-1", "investigator");

    expect(result.caseId).toBe("case-1");
    expect(result.bundles[0]?.canonicalDate).toBe("2024-03-07");
    expect(result.bundles[0]?.hospital).toBe("Seoul Hospital");
    expect(result.bundles[1]?.requiresReview).toBe(true);
    expect(result.bundles[1]?.notes).toEqual(["bundle ambiguity exceeds provisional threshold"]);
  });
});
