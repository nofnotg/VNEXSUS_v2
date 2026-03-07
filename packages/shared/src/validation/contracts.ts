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

export const ocrJobPayloadSchema = z.object({
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
export type OcrJobPayload = z.infer<typeof ocrJobPayloadSchema>;
