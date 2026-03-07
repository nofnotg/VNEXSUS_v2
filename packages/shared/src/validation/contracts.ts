import { z } from "zod";

export const patientInputSchema = z.object({
  patientName: z.string().min(1),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  insuranceJoinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  insuranceCompany: z.string().min(1).optional(),
  productType: z.string().min(1).optional()
});

export const evidenceRefContractSchema = z.object({
  evidenceId: z.string(),
  sourceFileId: z.string(),
  sourcePageId: z.string().optional(),
  fileOrder: z.number().int().nonnegative(),
  pageOrder: z.number().int().nonnegative(),
  blockIndex: z.number().int().nonnegative().optional(),
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
  confidence: z.number().min(0).max(1).optional()
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
