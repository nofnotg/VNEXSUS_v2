import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  bundles: [
    {
      id: "bundle-2",
      caseId: "case-1",
      canonicalDate: "2024-03-08",
      fileOrder: 1,
      pageOrder: 2,
      primaryHospital: "Seoul Hospital",
      bundleTypeCandidate: "surgery" as const,
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
      createdAt: new Date("2026-03-08T00:00:01.000Z")
    },
    {
      id: "bundle-1",
      caseId: "case-1",
      canonicalDate: "2024-03-07",
      fileOrder: 1,
      pageOrder: 1,
      primaryHospital: "Seoul Hospital",
      bundleTypeCandidate: "unknown" as const,
      representativeDiagnosis: null,
      representativeTest: "CT",
      representativeTreatment: null,
      representativeProcedure: null,
      representativeSurgery: null,
      admissionStatus: "both" as const,
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
        hospitals: ["Seoul Hospital"],
        departments: [],
        diagnoses: [],
        tests: ["CT"],
        treatments: [],
        procedures: [],
        surgeries: [],
        admissions: ["admitted"],
        discharges: ["discharged"],
        pathologies: [],
        medications: [],
        symptoms: []
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

import { getConsumerStructuredOutput } from "./consumer-output-service";

describe("consumer output service", () => {
  it("builds consumer summary output from EventBundles", async () => {
    const result = await getConsumerStructuredOutput("case-1", "user-1", "consumer");

    expect(result.caseId).toBe("case-1");
    expect(result.timelineSummary[0]?.canonicalDate).toBe("2024-03-07");
    expect(result.hospitalSummary).toEqual(["Seoul Hospital"]);
    expect(result.checkPoints).toContain("review_required_bundle_exists");
    expect(result.recommendedNextActions).toContain("check_surgery_records");
    expect(result.requiresReview).toBe(true);
  });
});
