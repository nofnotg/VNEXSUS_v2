import { describe, expect, it } from "vitest";
import {
  consumerSummaryJsonSchema,
  dateCandidateResponseContractSchema,
  dateCenteredWindowResponseContractSchema,
  entityCandidateResponseContractSchema,
  eventAtomResponseContractSchema,
  eventBundleResponseContractSchema,
  investigatorSlotJsonSchema,
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
      patientName: "Hong Gil Dong",
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
      textRaw: "Diagnosis note",
      textNormalized: "Diagnosis note",
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
      rawText: "Seoul Hospital",
      normalizedText: "Seoul Hospital",
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
        hospitals: ["Seoul Hospital"],
        departments: ["Internal Medicine"],
        diagnoses: ["Primary diagnosis"],
        tests: ["CT"],
        treatments: [],
        procedures: [],
        surgeries: [],
        admissions: [],
        discharges: [],
        pathologies: [],
        medications: ["Aspirin"],
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
      primaryHospital: "Seoul Hospital",
      primaryDepartment: "Internal Medicine",
      primaryDiagnosis: "Pneumonia",
      primaryTest: "CT",
      primaryTreatment: null,
      primaryProcedure: null,
      primarySurgery: null,
      admissionStatus: null,
      pathologySummary: null,
      medicationSummary: "Aspirin",
      symptomSummary: "Cough",
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
    });

    expect(parsed.success).toBe(true);
  });

  it("validates persisted EventBundle response contract", () => {
    const parsed = eventBundleResponseContractSchema.safeParse({
      id: "bundle-1",
      caseId: "case-1",
      canonicalDate: "2024-03-07",
      fileOrder: 1,
      pageOrder: 1,
      primaryHospital: "Seoul Hospital",
      bundleTypeCandidate: "outpatient",
      representativeDiagnosis: "Pneumonia",
      representativeTest: "CT",
      representativeTreatment: null,
      representativeProcedure: null,
      representativeSurgery: null,
      admissionStatus: null,
      ambiguityScore: 0.28,
      requiresReview: false,
      unresolvedBundleSlotsJson: {
        hospitalConflict: false,
        diagnosisConflict: false,
        mixedAtomTypes: false,
        weakGrouping: false,
        needsManualReview: false,
        notes: []
      },
      atomIdsJson: ["atom-1", "atom-2"],
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
    });

    expect(parsed.success).toBe(true);
  });

  it("validates investigator structured JSON contract", () => {
    const parsed = investigatorSlotJsonSchema.safeParse({
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
          ambiguityScore: 0.21,
          requiresReview: false,
          notes: []
        }
      ]
    });

    expect(parsed.success).toBe(true);
  });

  it("validates consumer structured summary contract", () => {
    const parsed = consumerSummaryJsonSchema.safeParse({
      caseId: "case-1",
      generatedAt: "2026-03-08T00:00:00.000Z",
      timelineSummary: [
        {
          canonicalDate: "2024-03-07",
          hospital: "Seoul Hospital",
          diagnosis: "Pneumonia",
          test: "CT",
          treatment: null,
          surgery: null,
          admissionStatus: null,
          reviewFlag: false
        }
      ],
      hospitalSummary: ["Seoul Hospital"],
      riskSignals: ["review_required_bundle"],
      checkPoints: ["review_required_bundle_exists"],
      recommendedNextActions: ["review_original_documents"],
      requiresReview: true
    });

    expect(parsed.success).toBe(true);
  });
});
