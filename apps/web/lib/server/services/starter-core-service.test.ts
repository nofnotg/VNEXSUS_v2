import { describe, expect, it, vi } from "vitest";

vi.mock("../demo-mode", () => ({
  isLocalDemoMode: vi.fn(() => false)
}));

vi.mock("./case-service", () => ({
  getCaseForUser: vi.fn(async () => ({
    id: "case-1",
    patientInput: {
      insuranceJoinDate: new Date("2024-01-15T00:00:00.000Z")
    },
    sourceDocuments: [
      {
        id: "doc-1",
        originalFileName: "서울병원_입원기록.pdf",
        fileOrder: 1,
        pageCount: 3
      }
    ],
    analysisJobs: [
      {
        completedAt: new Date("2026-03-23T10:00:00.000Z"),
        finishedAt: null,
        updatedAt: new Date("2026-03-23T10:00:01.000Z")
      }
    ]
  }))
}));

vi.mock("./event-bundle-service", () => ({
  listEventBundles: vi.fn(async () => [
    {
      id: "bundle-1",
      caseId: "case-1",
      canonicalDate: "2024-03-07",
      fileOrder: 1,
      pageOrder: 1,
      primaryHospital: "서울병원",
      bundleTypeCandidate: "exam" as const,
      representativeDiagnosis: "폐렴",
      representativeTest: "CT",
      representativeTreatment: null,
      representativeProcedure: null,
      representativeSurgery: null,
      admissionStatus: null,
      ambiguityScore: 0.62,
      requiresReview: true,
      unresolvedBundleSlotsJson: {
        hospitalConflict: false,
        diagnosisConflict: false,
        mixedAtomTypes: false,
        weakGrouping: true,
        needsManualReview: true,
        notes: ["bundle grouping is weak or sparse"]
      },
      atomIdsJson: ["atom-1"],
      candidateSnapshotJson: {
        hospitals: ["서울병원"],
        departments: ["호흡기내과"],
        diagnoses: ["폐렴"],
        tests: ["CT"],
        treatments: [],
        procedures: [],
        surgeries: [],
        admissions: [],
        discharges: [],
        pathologies: [],
        medications: [],
        symptoms: ["기침"]
      },
      createdAt: "2026-03-23T10:00:00.000Z"
    }
  ])
}));

import { getStarterCoreResult } from "./starter-core-service";

describe("starter core service", () => {
  it("assembles planner-facing starter core output from case metadata and event bundles", async () => {
    const result = await getStarterCoreResult("case-1", "user-1", "consumer");

    expect(result.caseBasicInfo).toEqual({
      caseId: "case-1",
      insuranceJoinDateAvailable: true,
      analysisTimestamp: "2026-03-23T10:00:00.000Z",
      activeTier: "starter"
    });
    expect(result.documentInventorySummary.totalDocuments).toBe(1);
    expect(result.medicalEventTimeline[0]?.eventType).toBe("exam");
    expect(result.medicalEventTimeline[0]?.reviewNeeded).toBe(true);
    expect(result.warningSummary.reviewNeededCount).toBe(1);
    expect(result.warningSummary.sourceQualityWarnings).toContain(
      "Some medical events require manual review because evidence is weak or unresolved."
    );
  });
});
