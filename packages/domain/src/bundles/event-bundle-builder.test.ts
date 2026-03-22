import { describe, expect, it } from "vitest";
import { buildProvisionalEventBundles } from "./event-bundle-builder";

describe("event bundle builder", () => {
  it("groups same-day soft clinical atoms with alias-resolved hospitals", () => {
    const bundles = buildProvisionalEventBundles([
      {
        id: "atom-1",
        caseId: "case-1",
        sourceWindowId: "window-1",
        sourceFileId: "doc-1",
        sourcePageId: "page-1",
        canonicalDate: "2024-03-07",
        fileOrder: 1,
        pageOrder: 1,
        anchorBlockIndex: 2,
        primaryHospital: "SM \uC601\uC0C1\uC758\uD559\uACFC \uC758\uC6D0",
        primaryDepartment: "\uC601\uC0C1\uC758\uD559\uACFC",
        primaryDiagnosis: "\uB450\uD1B5",
        primaryTest: null,
        primaryTreatment: null,
        primaryProcedure: null,
        primarySurgery: null,
        admissionStatus: null,
        pathologySummary: null,
        medicationSummary: null,
        symptomSummary: null,
        eventTypeCandidate: "outpatient",
        ambiguityScore: 0.2,
        requiresReview: false,
        unresolvedSlotsJson: {
          hospitalMissing: false,
          diagnosisMissing: false,
          conflictingDiagnosis: false,
          conflictingHospital: false,
          weakEvidence: false,
          needsManualReview: false,
          notes: []
        },
        candidateSnapshotJson: {
          hospitals: ["SM \uC601\uC0C1\uC758\uD559\uACFC \uC758\uC6D0"],
          departments: ["\uC601\uC0C1\uC758\uD559\uACFC"],
          diagnoses: ["\uB450\uD1B5"],
          tests: [],
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
      },
      {
        id: "atom-2",
        caseId: "case-1",
        sourceWindowId: "window-2",
        sourceFileId: "doc-1",
        sourcePageId: "page-2",
        canonicalDate: "2024-03-07",
        fileOrder: 1,
        pageOrder: 1,
        anchorBlockIndex: 6,
        primaryHospital: "\uC5D0\uC2A4\uC5E0\uC601\uC0C1\uC758\uD559\uACFC\uC758\uC6D0",
        primaryDepartment: "\uC601\uC0C1\uC758\uD559\uACFC",
        primaryDiagnosis: "\uB450\uD1B5",
        primaryTest: "CT",
        primaryTreatment: null,
        primaryProcedure: null,
        primarySurgery: null,
        admissionStatus: null,
        pathologySummary: null,
        medicationSummary: null,
        symptomSummary: null,
        eventTypeCandidate: "exam",
        ambiguityScore: 0.22,
        requiresReview: false,
        unresolvedSlotsJson: {
          hospitalMissing: false,
          diagnosisMissing: false,
          conflictingDiagnosis: false,
          conflictingHospital: false,
          weakEvidence: false,
          needsManualReview: false,
          notes: []
        },
        candidateSnapshotJson: {
          hospitals: ["\uC5D0\uC2A4\uC5E0\uC601\uC0C1\uC758\uD559\uACFC\uC758\uC6D0"],
          departments: ["\uC601\uC0C1\uC758\uD559\uACFC"],
          diagnoses: ["\uB450\uD1B5"],
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
        createdAt: "2026-03-08T00:00:01.000Z"
      }
    ]);

    expect(bundles).toHaveLength(1);
    expect(bundles[0]?.bundleTypeCandidate).toBe("mixed");
    expect(bundles[0]?.primaryHospital).toBe("\uC5D0\uC2A4\uC5E0\uC601\uC0C1\uC758\uD559\uACFC\uC758\uC6D0");
    expect(bundles[0]?.candidateSnapshotJson.hospitals).toEqual([
      "SM \uC601\uC0C1\uC758\uD559\uACFC \uC758\uC6D0",
      "\uC5D0\uC2A4\uC5E0\uC601\uC0C1\uC758\uD559\uACFC\uC758\uC6D0"
    ]);
    expect(bundles[0]?.atomIdsJson).toEqual(["atom-1", "atom-2"]);
  });

  it("merges same-day atoms when clinical context is continuous across a modest block gap", () => {
    const bundles = buildProvisionalEventBundles([
      {
        id: "atom-a",
        caseId: "case-1",
        sourceWindowId: "window-a",
        sourceFileId: "doc-1",
        sourcePageId: "page-1",
        canonicalDate: "2024-03-07",
        fileOrder: 1,
        pageOrder: 3,
        anchorBlockIndex: 10,
        primaryHospital: "\uC0BC\uC131\uC11C\uC6B8\uBCD1\uC6D0",
        primaryDepartment: "\uC815\uD615\uC678\uACFC",
        primaryDiagnosis: "\uB514\uC2A4\uD06C",
        primaryTest: null,
        primaryTreatment: "\uBB3C\uB9AC\uCE58\uB8CC",
        primaryProcedure: null,
        primarySurgery: null,
        admissionStatus: null,
        pathologySummary: null,
        medicationSummary: null,
        symptomSummary: null,
        eventTypeCandidate: "treatment",
        ambiguityScore: 0.18,
        requiresReview: false,
        unresolvedSlotsJson: {
          hospitalMissing: false,
          diagnosisMissing: false,
          conflictingDiagnosis: false,
          conflictingHospital: false,
          weakEvidence: false,
          needsManualReview: false,
          notes: []
        },
        candidateSnapshotJson: {
          hospitals: ["\uC0BC\uC131\uC11C\uC6B8\uBCD1\uC6D0"],
          departments: ["\uC815\uD615\uC678\uACFC"],
          diagnoses: ["\uB514\uC2A4\uD06C"],
          tests: [],
          treatments: ["\uBB3C\uB9AC\uCE58\uB8CC"],
          procedures: [],
          surgeries: [],
          admissions: [],
          discharges: [],
          pathologies: [],
          medications: [],
          symptoms: []
        },
        createdAt: "2026-03-08T00:00:00.000Z"
      },
      {
        id: "atom-b",
        caseId: "case-1",
        sourceWindowId: "window-b",
        sourceFileId: "doc-1",
        sourcePageId: "page-1",
        canonicalDate: "2024-03-07",
        fileOrder: 1,
        pageOrder: 3,
        anchorBlockIndex: 24,
        primaryHospital: "\uC0BC\uC131\uC11C\uC6B8\uBCD1\uC6D0",
        primaryDepartment: "\uC815\uD615\uC678\uACFC",
        primaryDiagnosis: "\uB514\uC2A4\uD06C",
        primaryTest: "MRI",
        primaryTreatment: null,
        primaryProcedure: null,
        primarySurgery: null,
        admissionStatus: null,
        pathologySummary: null,
        medicationSummary: null,
        symptomSummary: null,
        eventTypeCandidate: "exam",
        ambiguityScore: 0.2,
        requiresReview: false,
        unresolvedSlotsJson: {
          hospitalMissing: false,
          diagnosisMissing: false,
          conflictingDiagnosis: false,
          conflictingHospital: false,
          weakEvidence: false,
          needsManualReview: false,
          notes: []
        },
        candidateSnapshotJson: {
          hospitals: ["\uC0BC\uC131\uC11C\uC6B8\uBCD1\uC6D0"],
          departments: ["\uC815\uD615\uC678\uACFC"],
          diagnoses: ["\uB514\uC2A4\uD06C"],
          tests: ["MRI"],
          treatments: [],
          procedures: [],
          surgeries: [],
          admissions: [],
          discharges: [],
          pathologies: [],
          medications: [],
          symptoms: []
        },
        createdAt: "2026-03-08T00:00:01.000Z"
      }
    ]);

    expect(bundles).toHaveLength(1);
    expect(bundles[0]?.atomIdsJson).toEqual(["atom-a", "atom-b"]);
  });

  it("keeps surgery atoms separate from soft grouped outpatient atoms", () => {
    const bundles = buildProvisionalEventBundles([
      {
        id: "atom-1",
        caseId: "case-1",
        sourceWindowId: "window-1",
        sourceFileId: "doc-1",
        sourcePageId: "page-1",
        canonicalDate: "2024-03-07",
        fileOrder: 1,
        pageOrder: 1,
        anchorBlockIndex: 2,
        primaryHospital: "\uC11C\uC6B8\uBCD1\uC6D0",
        primaryDepartment: null,
        primaryDiagnosis: "\uB514\uC2A4\uD06C",
        primaryTest: null,
        primaryTreatment: null,
        primaryProcedure: null,
        primarySurgery: "\uB514\uC2A4\uD06C \uC218\uC220",
        admissionStatus: null,
        pathologySummary: null,
        medicationSummary: null,
        symptomSummary: null,
        eventTypeCandidate: "surgery",
        ambiguityScore: 0.2,
        requiresReview: false,
        unresolvedSlotsJson: {
          hospitalMissing: false,
          diagnosisMissing: false,
          conflictingDiagnosis: false,
          conflictingHospital: false,
          weakEvidence: false,
          needsManualReview: false,
          notes: []
        },
        candidateSnapshotJson: {
          hospitals: ["\uC11C\uC6B8\uBCD1\uC6D0"],
          departments: [],
          diagnoses: ["\uB514\uC2A4\uD06C"],
          tests: [],
          treatments: [],
          procedures: [],
          surgeries: ["\uB514\uC2A4\uD06C \uC218\uC220"],
          admissions: [],
          discharges: [],
          pathologies: [],
          medications: [],
          symptoms: []
        },
        createdAt: "2026-03-08T00:00:00.000Z"
      },
      {
        id: "atom-2",
        caseId: "case-1",
        sourceWindowId: "window-2",
        sourceFileId: "doc-1",
        sourcePageId: "page-1",
        canonicalDate: "2024-03-07",
        fileOrder: 1,
        pageOrder: 1,
        anchorBlockIndex: 4,
        primaryHospital: "\uC11C\uC6B8\uBCD1\uC6D0",
        primaryDepartment: null,
        primaryDiagnosis: "\uB514\uC2A4\uD06C",
        primaryTest: null,
        primaryTreatment: "약물 치료",
        primaryProcedure: null,
        primarySurgery: null,
        admissionStatus: null,
        pathologySummary: null,
        medicationSummary: null,
        symptomSummary: null,
        eventTypeCandidate: "treatment",
        ambiguityScore: 0.3,
        requiresReview: false,
        unresolvedSlotsJson: {
          hospitalMissing: false,
          diagnosisMissing: false,
          conflictingDiagnosis: false,
          conflictingHospital: false,
          weakEvidence: false,
          needsManualReview: false,
          notes: []
        },
        candidateSnapshotJson: {
          hospitals: ["\uC11C\uC6B8\uBCD1\uC6D0"],
          departments: [],
          diagnoses: ["\uB514\uC2A4\uD06C"],
          tests: [],
          treatments: ["약물 치료"],
          procedures: [],
          surgeries: [],
          admissions: [],
          discharges: [],
          pathologies: [],
          medications: [],
          symptoms: []
        },
        createdAt: "2026-03-08T00:00:01.000Z"
      }
    ]);

    expect(bundles).toHaveLength(2);
    expect(bundles[0]?.bundleTypeCandidate).toBe("surgery");
    expect(bundles[1]?.bundleTypeCandidate).toBe("treatment");
  });
});
