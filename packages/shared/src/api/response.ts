import { randomUUID } from "node:crypto";
import { z } from "zod";

export const apiMetaSchema = z.object({
  requestId: z.string()
});

export const apiErrorPayloadSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional()
});

export const apiSuccessEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: apiMetaSchema
  });

export const apiErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: apiErrorPayloadSchema,
  meta: apiMetaSchema
});

export function createApiSuccess<T>(data: T) {
  return {
    success: true as const,
    data,
    meta: {
      requestId: randomUUID()
    }
  };
}

export function createApiError(code: string, message: string, details?: Record<string, unknown>) {
  return {
    success: false as const,
    error: {
      code,
      message,
      details
    },
    meta: {
      requestId: randomUUID()
    }
  };
}
