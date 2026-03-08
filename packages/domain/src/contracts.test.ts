import { describe, expect, it } from "vitest";
import {
  eventAtomResponseContractSchema,
  dateCenteredWindowResponseContractSchema,
  dateCandidateResponseContractSchema,
  entityCandidateResponseContractSchema,
  loadAppEnv,
  ocrBlockResponseContractSchema,
  ocrIngestionJobPayloadSchema,
  patientInputSchema
} from "@vnexus/shared";
import { planGatingBaseline } from "./plans/plan-gating";
import { consumerSummarySchema, investigatorSlotSeedSchema } from "./reports/contracts";

describe("Epic 0 contracts", () => {
  it("keeps insuranceJoinDate as required user input metadata", () => {
    const parsed = patientInputSchema.safeParse({
      patientName: "홍길동",
      insuranceJoinDate: "2022-01-01"
    });

    expect(parsed.success).toBe(true);
  });

  it("validates the consumer summary contract", () => {
    const parsed = consumerSummarySchema.safeParse({
      risk_signals: [],
      timeline_summary: [],
      hospital_summary: [],
      check_points: [],
      recommended_next_actions: []
    });

    expect(parsed.success).toBe(true);
  });

  it("blocks precision for 미리확인 and Starter", () => {
    expect(planGatingBaseline.consumer["미리확인"].precisionAllowed).toBe(false);
    expect(planGatingBaseline.investigator.Starter.precisionAllowed).toBe(false);
  });

  it("reports missing env variables in readiness validation", () => {
    const result = loadAppEnv({});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });

  it("requires sourceDocumentIds in OCR job payload", () => {
    const parsed = ocrIngestionJobPayloadSchema.safeParse({
      caseId: "case-1",
      sourceDocumentIds: ["doc-1"],
      fileOrders: [1],
      requestedByUserId: "user-1",
      ingestionMode: "ocr",
      enqueueReason: "manual_case_upload",
      idempotencyKey: "abc",
      allowedTransitions: ["queued", "processing", "completed", "failed"]
    });

    expect(parsed.success).toBe(true);
  });

  it("keeps consumer summary and investigator slot seed as separate contracts", () => {
    expect(consumerSummarySchema.shape).not.toBe(investigatorSlotSeedSchema.shape);
  });

  it("validates persisted OCR block response contract", () => {
    const parsed = ocrBlockResponseContractSchema.safeParse({
      id: "block-1",
      caseId: "case-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      fileOrder: 1,
      pageOrder: 1,
      blockIndex: 0,
      textRaw: "진단서",
      textNormalized: "진단서",
      bboxJson: {
        xMin: 0,
        yMin: 0,
        xMax: 100,
        yMax: 20
      },
      confidence: 0.98,
      createdAt: "2026-03-08T00:00:00.000Z"
    });

    expect(parsed.success).toBe(true);
  });

  it("validates persisted DateCandidate response contract", () => {
    const parsed = dateCandidateResponseContractSchema.safeParse({
      id: "candidate-1",
      caseId: "case-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      fileOrder: 1,
      pageOrder: 1,
      blockIndex: 0,
      rawDateText: "2024.03.07",
      normalizedDate: "2024-03-07",
      dateTypeCandidate: "visit",
      confidence: 0.92,
      createdAt: "2026-03-08T00:00:00.000Z"
    });

    expect(parsed.success).toBe(true);
  });

  it("validates persisted EntityCandidate response contract", () => {
    const parsed = entityCandidateResponseContractSchema.safeParse({
      id: "entity-1",
      caseId: "case-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      relatedDateCandidateId: "date-1",
      fileOrder: 1,
      pageOrder: 1,
      blockIndex: 0,
      candidateType: "hospital",
      rawText: "서울병원",
      normalizedText: "서울병원",
      confidence: 0.88,
      metadataJson: {
        source: "keyword"
      },
      createdAt: "2026-03-08T00:00:00.000Z"
    });

    expect(parsed.success).toBe(true);
  });

  it("validates persisted DateCenteredWindow response contract", () => {
    const parsed = dateCenteredWindowResponseContractSchema.safeParse({
      id: "window-1",
      caseId: "case-1",
      dateCandidateId: "date-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      canonicalDate: "2024-03-07",
      fileOrder: 1,
      pageOrder: 1,
      anchorBlockIndex: 3,
      windowStartBlockIndex: 1,
      windowEndBlockIndex: 5,
      candidateSummaryJson: {
        hospitals: ["서울병원"],
        departments: ["내과"],
        diagnoses: ["주상병"],
        tests: ["CT"],
        treatments: [],
        procedures: [],
        surgeries: [],
        admissions: [],
        discharges: [],
        pathologies: [],
        medications: ["처방"],
        symptoms: []
      },
      createdAt: "2026-03-08T00:00:00.000Z"
    });

    expect(parsed.success).toBe(true);
  });

  it("validates persisted EventAtom response contract", () => {
    const parsed = eventAtomResponseContractSchema.safeParse({
      id: "atom-1",
      caseId: "case-1",
      sourceWindowId: "window-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      canonicalDate: "2024-03-07",
      fileOrder: 1,
      pageOrder: 1,
      anchorBlockIndex: 3,
      primaryHospital: "서울병원",
      primaryDepartment: "내과",
      primaryDiagnosis: "폐렴",
      primaryTest: "CT",
      primaryTreatment: null,
      primaryProcedure: null,
      primarySurgery: null,
      admissionStatus: null,
      pathologySummary: null,
      medicationSummary: "항생제",
      symptomSummary: "기침",
      eventTypeCandidate: "exam",
      ambiguityScore: 0.21,
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
        medications: ["항생제"],
        symptoms: ["기침"]
      },
      createdAt: "2026-03-08T00:00:00.000Z"
    });

    expect(parsed.success).toBe(true);
  });
});
