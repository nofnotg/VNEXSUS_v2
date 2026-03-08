import { describe, expect, it } from "vitest";
import { buildProvisionalEventBundles } from "./event-bundle-builder";

describe("event bundle builder", () => {
  it("groups same-date same-hospital outpatient atoms conservatively", () => {
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
        primaryHospital: "서울병원",
        primaryDepartment: "내과",
        primaryDiagnosis: "폐렴",
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
          hospitals: ["서울병원"],
          departments: ["내과"],
          diagnoses: ["폐렴"],
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
        pageOrder: 2,
        anchorBlockIndex: 1,
        primaryHospital: "서울병원",
        primaryDepartment: "내과",
        primaryDiagnosis: "폐렴",
        primaryTest: "CT",
        primaryTreatment: null,
        primaryProcedure: null,
        primarySurgery: null,
        admissionStatus: null,
        pathologySummary: null,
        medicationSummary: null,
        symptomSummary: null,
        eventTypeCandidate: "outpatient",
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
          hospitals: ["서울병원"],
          departments: ["내과"],
          diagnoses: ["폐렴"],
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
    expect(bundles[0]?.bundleTypeCandidate).toBe("outpatient");
    expect(bundles[0]?.primaryHospital).toBe("서울병원");
    expect(bundles[0]?.representativeDiagnosis).toBe("폐렴");
    expect(bundles[0]?.atomIdsJson).toEqual(["atom-1", "atom-2"]);
  });

  it("separates surgery atoms and marks conflicts for review", () => {
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
        primaryHospital: "서울병원",
        primaryDepartment: null,
        primaryDiagnosis: "담낭염",
        primaryTest: null,
        primaryTreatment: null,
        primaryProcedure: null,
        primarySurgery: "절제술",
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
          hospitals: ["서울병원"],
          departments: [],
          diagnoses: ["담낭염"],
          tests: [],
          treatments: [],
          procedures: [],
          surgeries: ["절제술"],
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
        anchorBlockIndex: 5,
        primaryHospital: "중앙병원",
        primaryDepartment: null,
        primaryDiagnosis: "담낭염 의증",
        primaryTest: null,
        primaryTreatment: null,
        primaryProcedure: null,
        primarySurgery: "절제술",
        admissionStatus: null,
        pathologySummary: null,
        medicationSummary: null,
        symptomSummary: null,
        eventTypeCandidate: "surgery",
        ambiguityScore: 0.3,
        requiresReview: true,
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
          hospitals: ["중앙병원"],
          departments: [],
          diagnoses: ["담낭염 의증"],
          tests: [],
          treatments: [],
          procedures: [],
          surgeries: ["절제술"],
          admissions: [],
          discharges: [],
          pathologies: [],
          medications: [],
          symptoms: []
        },
        createdAt: "2026-03-08T00:00:01.000Z"
      },
      {
        id: "atom-3",
        caseId: "case-1",
        sourceWindowId: "window-3",
        sourceFileId: "doc-1",
        sourcePageId: "page-1",
        canonicalDate: "2024-03-07",
        fileOrder: 1,
        pageOrder: 1,
        anchorBlockIndex: 7,
        primaryHospital: "서울병원",
        primaryDepartment: null,
        primaryDiagnosis: "담낭염",
        primaryTest: null,
        primaryTreatment: null,
        primaryProcedure: null,
        primarySurgery: null,
        admissionStatus: "both",
        pathologySummary: null,
        medicationSummary: null,
        symptomSummary: null,
        eventTypeCandidate: "mixed",
        ambiguityScore: 0.7,
        requiresReview: true,
        unresolvedSlotsJson: {
          hospitalMissing: false,
          diagnosisMissing: false,
          conflictingDiagnosis: false,
          conflictingHospital: false,
          weakEvidence: false,
          needsManualReview: true,
          notes: []
        },
        candidateSnapshotJson: {
          hospitals: ["서울병원"],
          departments: [],
          diagnoses: ["담낭염"],
          tests: [],
          treatments: [],
          procedures: [],
          surgeries: [],
          admissions: ["입원"],
          discharges: ["퇴원"],
          pathologies: [],
          medications: [],
          symptoms: []
        },
        createdAt: "2026-03-08T00:00:02.000Z"
      }
    ]);

    expect(bundles).toHaveLength(3);
    expect(bundles[0]?.bundleTypeCandidate).toBe("surgery");
    expect(bundles[1]?.bundleTypeCandidate).toBe("surgery");
    expect(bundles[2]?.bundleTypeCandidate).toBe("mixed");
    expect(bundles[2]?.requiresReview).toBe(true);
    expect(bundles[2]?.unresolvedBundleSlotsJson.mixedAtomTypes).toBe(false);
  });
});
