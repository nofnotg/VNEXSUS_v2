import { z } from "zod";

export const caseAudienceSchema = z.enum(["consumer", "investigator"]);

export const caseStatusSchema = z.enum([
  "draft",
  "uploaded",
  "processing",
  "ready",
  "review_required",
  "archived"
]);

export const caseCreateSchema = z.object({
  title: z.string().min(1),
  audience: caseAudienceSchema
});

export const caseUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  status: caseStatusSchema.optional()
});

export const patientInputSchema = z.object({
  patientName: z.string().min(1),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  insuranceJoinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  insuranceCompany: z.string().min(1).optional(),
  productType: z.string().min(1).optional()
});

export const documentCreateSchema = z.object({
  originalFileName: z.string().min(1),
  mimeType: z.string().min(1),
  pageCount: z.number().int().positive(),
  storagePath: z.string().min(1).optional()
});

export const ocrJobStatusSchema = z.enum(["queued", "processing", "completed", "failed"]);

export const dateTypeCandidateSchema = z.enum([
  "visit",
  "exam",
  "report",
  "pathology",
  "surgery",
  "admission",
  "discharge",
  "plan",
  "admin",
  "irrelevant"
]);

export const entityCandidateTypeSchema = z.enum([
  "hospital",
  "department",
  "diagnosis",
  "test",
  "treatment",
  "procedure",
  "surgery",
  "admission",
  "discharge",
  "pathology",
  "medication",
  "symptom",
  "admin",
  "unknown"
]);

export const eventTypeCandidateSchema = z.enum([
  "outpatient",
  "exam",
  "treatment",
  "procedure",
  "surgery",
  "admission",
  "discharge",
  "pathology",
  "followup",
  "mixed",
  "unknown"
]);

export const ocrBlockSchema = z.object({
  id: z.string().optional(),
  caseId: z.string().min(1),
  sourceFileId: z.string().min(1),
  sourcePageId: z.string().min(1),
  fileOrder: z.number().int().positive(),
  pageOrder: z.number().int().positive(),
  blockIndex: z.number().int().nonnegative(),
  textRaw: z.string(),
  textNormalized: z.string(),
  bboxJson: z
    .object({
      xMin: z.number(),
      yMin: z.number(),
      xMax: z.number(),
      yMax: z.number()
    })
    .nullable()
    .optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  createdAt: z.string().datetime().optional()
});

export const ocrBlockResponseContractSchema = ocrBlockSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime()
});

export const dateCandidateSchema = z.object({
  id: z.string().optional(),
  caseId: z.string().min(1),
  sourceFileId: z.string().min(1),
  sourcePageId: z.string().min(1),
  fileOrder: z.number().int().positive(),
  pageOrder: z.number().int().positive(),
  blockIndex: z.number().int().nonnegative(),
  rawDateText: z.string().min(1),
  normalizedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  dateTypeCandidate: dateTypeCandidateSchema,
  confidence: z.number().min(0).max(1),
  createdAt: z.string().datetime().optional()
});

export const dateCandidateResponseContractSchema = dateCandidateSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime()
});

export const entityCandidateSchema = z.object({
  id: z.string().optional(),
  caseId: z.string().min(1),
  sourceFileId: z.string().min(1),
  sourcePageId: z.string().min(1),
  relatedDateCandidateId: z.string().min(1).nullable().optional(),
  fileOrder: z.number().int().positive(),
  pageOrder: z.number().int().positive(),
  blockIndex: z.number().int().nonnegative(),
  candidateType: entityCandidateTypeSchema,
  rawText: z.string().min(1),
  normalizedText: z.string().min(1),
  confidence: z.number().min(0).max(1),
  metadataJson: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: z.string().datetime().optional()
});

export const entityCandidateResponseContractSchema = entityCandidateSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime()
});

export const candidateSummarySchema = z.object({
  hospitals: z.array(z.string()),
  departments: z.array(z.string()),
  diagnoses: z.array(z.string()),
  tests: z.array(z.string()),
  treatments: z.array(z.string()),
  procedures: z.array(z.string()),
  surgeries: z.array(z.string()),
  admissions: z.array(z.string()),
  discharges: z.array(z.string()),
  pathologies: z.array(z.string()),
  medications: z.array(z.string()),
  symptoms: z.array(z.string())
});

export const dateCenteredWindowSchema = z.object({
  id: z.string().optional(),
  caseId: z.string().min(1),
  dateCandidateId: z.string().min(1),
  sourceFileId: z.string().min(1),
  sourcePageId: z.string().min(1),
  canonicalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fileOrder: z.number().int().positive(),
  pageOrder: z.number().int().positive(),
  anchorBlockIndex: z.number().int().nonnegative(),
  windowStartBlockIndex: z.number().int().nonnegative(),
  windowEndBlockIndex: z.number().int().nonnegative(),
  candidateSummaryJson: candidateSummarySchema,
  createdAt: z.string().datetime().optional()
});

export const dateCenteredWindowResponseContractSchema = dateCenteredWindowSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime()
});

export const unresolvedSlotsSchema = z.object({
  hospitalMissing: z.boolean(),
  diagnosisMissing: z.boolean(),
  conflictingDiagnosis: z.boolean(),
  conflictingHospital: z.boolean(),
  weakEvidence: z.boolean(),
  needsManualReview: z.boolean(),
  notes: z.array(z.string())
});

export const eventAtomSchema = z.object({
  id: z.string().optional(),
  caseId: z.string().min(1),
  sourceWindowId: z.string().min(1),
  sourceFileId: z.string().min(1),
  sourcePageId: z.string().min(1),
  canonicalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fileOrder: z.number().int().positive(),
  pageOrder: z.number().int().positive(),
  anchorBlockIndex: z.number().int().nonnegative(),
  primaryHospital: z.string().nullable().optional(),
  primaryDepartment: z.string().nullable().optional(),
  primaryDiagnosis: z.string().nullable().optional(),
  primaryTest: z.string().nullable().optional(),
  primaryTreatment: z.string().nullable().optional(),
  primaryProcedure: z.string().nullable().optional(),
  primarySurgery: z.string().nullable().optional(),
  admissionStatus: z.enum(["admitted", "discharged", "both"]).nullable().optional(),
  pathologySummary: z.string().nullable().optional(),
  medicationSummary: z.string().nullable().optional(),
  symptomSummary: z.string().nullable().optional(),
  eventTypeCandidate: eventTypeCandidateSchema,
  ambiguityScore: z.number().min(0).max(1),
  requiresReview: z.boolean(),
  unresolvedSlotsJson: unresolvedSlotsSchema,
  candidateSnapshotJson: candidateSummarySchema,
  createdAt: z.string().datetime().optional()
});

export const eventAtomResponseContractSchema = eventAtomSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime()
});

export const ocrIngestionJobPayloadSchema = z.object({
  caseId: z.string().min(1),
  sourceDocumentIds: z.array(z.string().min(1)).min(1),
  fileOrders: z.array(z.number().int().positive()).min(1),
  requestedByUserId: z.string().min(1),
  ingestionMode: z.enum(["metadata-only", "ocr"]),
  enqueueReason: z.enum(["manual_case_upload", "retry", "system_followup"]),
  idempotencyKey: z.string().min(1),
  allowedTransitions: z.array(ocrJobStatusSchema).length(4)
});

export const ocrJobCreateSchema = z.object({
  sourceDocumentIds: z.array(z.string().min(1)).min(1),
  enqueueReason: z.enum(["manual_case_upload", "retry", "system_followup"]).default("manual_case_upload")
});

export const jobStatusSchema = z.enum(["queued", "processing", "completed", "failed"]);

export const evidenceKindSchema = z.enum(["ocr_block", "merged_window", "page_region"]);

export const evidenceStorageSchema = z.object({
  caseId: z.string(),
  sourceFileId: z.string(),
  sourcePageId: z.string(),
  fileOrder: z.number().int().nonnegative(),
  pageOrder: z.number().int().nonnegative(),
  evidenceKind: evidenceKindSchema,
  blockIndexStart: z.number().int().nonnegative().optional(),
  blockIndexEnd: z.number().int().nonnegative().optional(),
  bbox: z
    .object({
      xMin: z.number(),
      yMin: z.number(),
      xMax: z.number(),
      yMax: z.number()
    })
    .optional(),
  quote: z.string().min(1),
  contextBefore: z.string().optional(),
  contextAfter: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  createdAt: z.string().datetime().optional()
});

export const evidenceRefContractSchema = evidenceStorageSchema.extend({
  evidenceId: z.string(),
  createdAt: z.string().datetime()
});

export const consumerSummarySchema = z.object({
  risk_signals: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      severity: z.enum(["low", "medium", "high"]),
      evidenceRefs: z.array(evidenceRefContractSchema).default([])
    })
  ),
  timeline_summary: z.array(
    z.object({
      date: z.string(),
      eventLabel: z.string(),
      hospital: z.string().optional(),
      evidenceRefs: z.array(evidenceRefContractSchema).default([])
    })
  ),
  hospital_summary: z.array(
    z.object({
      hospital: z.string(),
      eventCount: z.number().int().nonnegative(),
      evidenceRefs: z.array(evidenceRefContractSchema).default([])
    })
  ),
  check_points: z.array(z.string()),
  recommended_next_actions: z.array(z.string())
});

export type CaseCreateInput = z.infer<typeof caseCreateSchema>;
export type CaseUpdateInput = z.infer<typeof caseUpdateSchema>;
export type PatientInput = z.infer<typeof patientInputSchema>;
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type OcrJobCreateInput = z.infer<typeof ocrJobCreateSchema>;
export type OcrIngestionJobPayload = z.infer<typeof ocrIngestionJobPayloadSchema>;
export type OcrBlockInput = z.infer<typeof ocrBlockSchema>;
export type OcrBlockResponseContract = z.infer<typeof ocrBlockResponseContractSchema>;
export type DateCandidateInput = z.infer<typeof dateCandidateSchema>;
export type DateCandidateResponseContract = z.infer<typeof dateCandidateResponseContractSchema>;
export type EntityCandidateInput = z.infer<typeof entityCandidateSchema>;
export type EntityCandidateResponseContract = z.infer<typeof entityCandidateResponseContractSchema>;
export type CandidateSummary = z.infer<typeof candidateSummarySchema>;
export type DateCenteredWindowInput = z.infer<typeof dateCenteredWindowSchema>;
export type DateCenteredWindowResponseContract = z.infer<typeof dateCenteredWindowResponseContractSchema>;
export type UnresolvedSlots = z.infer<typeof unresolvedSlotsSchema>;
export type EventAtomInput = z.infer<typeof eventAtomSchema>;
export type EventAtomResponseContract = z.infer<typeof eventAtomResponseContractSchema>;
