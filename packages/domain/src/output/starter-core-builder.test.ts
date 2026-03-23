import { describe, expect, it } from "vitest";
import { buildStarterCoreResult } from "./starter-core-builder";

describe("starter core builder", () => {
  it("assembles case info, document inventory, timeline, and warnings for starter core output", () => {
    const result = buildStarterCoreResult({
      caseId: "case-1",
      insuranceJoinDate: "2024-01-01",
      analysisTimestamp: "2026-03-23T10:00:00.000Z",
      sourceDocuments: [
        {
          id: "doc-1",
          originalFileName: "서울병원_입원기록.pdf",
          fileOrder: 1,
          pageCount: 3
        },
        {
          id: "doc-2",
          originalFileName: "서울병원_병리보고서.pdf",
          fileOrder: 2,
          pageCount: 2
        }
      ],
      bundles: [
        {
          id: "bundle-2",
          caseId: "case-1",
          canonicalDate: "2024-03-08",
          fileOrder: 2,
          pageOrder: 1,
          primaryHospital: "서울병원",
          bundleTypeCandidate: "pathology",
          representativeDiagnosis: "갑상선암",
          representativeTest: null,
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
          atomIdsJson: ["atom-2"],
          candidateSnapshotJson: {
            hospitals: ["서울병원"],
            departments: ["병리과"],
            diagnoses: ["갑상선암"],
            tests: [],
            treatments: [],
            procedures: [],
            surgeries: [],
            admissions: [],
            discharges: [],
            pathologies: ["유두암 의심"],
            medications: [],
            symptoms: []
          },
          createdAt: "2026-03-23T10:00:00.000Z"
        },
        {
          id: "bundle-1",
          caseId: "case-1",
          canonicalDate: "2024-03-07",
          fileOrder: 1,
          pageOrder: 1,
          primaryHospital: "서울병원",
          bundleTypeCandidate: "admission",
          representativeDiagnosis: "복통",
          representativeTest: "CT",
          representativeTreatment: null,
          representativeProcedure: null,
          representativeSurgery: null,
          admissionStatus: "admitted",
          ambiguityScore: 0.58,
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
            departments: ["외과"],
            diagnoses: ["복통"],
            tests: ["CT"],
            treatments: [],
            procedures: [],
            surgeries: [],
            admissions: ["admitted"],
            discharges: [],
            pathologies: [],
            medications: [],
            symptoms: ["통증"]
          },
          createdAt: "2026-03-23T09:59:00.000Z"
        }
      ]
    });

    expect(result.caseBasicInfo).toEqual({
      caseId: "case-1",
      insuranceJoinDateAvailable: true,
      analysisTimestamp: "2026-03-23T10:00:00.000Z",
      activeTier: "starter"
    });
    expect(result.documentInventorySummary.totalDocuments).toBe(2);
    expect(result.documentInventorySummary.totalPages).toBe(5);
    expect(result.documentInventorySummary.hospitalsMentioned).toContain("서울병원");
    expect(result.documentInventorySummary.dateRange).toEqual({
      earliestEventDate: "2024-03-07",
      latestEventDate: "2024-03-08"
    });
    expect(result.medicalEventTimeline[0]?.eventType).toBe("admission");
    expect(result.medicalEventTimeline[0]?.representativeEvidenceEntryPoint).toEqual({
      entryType: "event_bundle",
      eventBundleId: "bundle-1",
      fileOrder: 1,
      pageOrder: 1
    });
    expect(result.warningSummary.overallConfidence).toBe("medium");
    expect(result.warningSummary.reviewNeededCount).toBe(1);
    expect(result.warningSummary.unresolvedCount).toBe(1);
    expect(result.warningSummary.sourceQualityWarnings).toContain(
      "Some medical events require manual review because evidence is weak or unresolved."
    );
  });

  it("keeps warnings honest when no timeline can be assembled", () => {
    const result = buildStarterCoreResult({
      caseId: "case-2",
      sourceDocuments: [],
      bundles: [],
      analysisTimestamp: "2026-03-23T10:00:00.000Z"
    });

    expect(result.caseBasicInfo.insuranceJoinDateAvailable).toBe(false);
    expect(result.documentInventorySummary.sourceQualityNotices).toContain(
      "No source documents are attached to this case yet."
    );
    expect(result.warningSummary.overallConfidence).toBe("low");
    expect(result.warningSummary.reviewNeededCount).toBe(0);
    expect(result.medicalEventTimeline).toEqual([]);
  });
});
