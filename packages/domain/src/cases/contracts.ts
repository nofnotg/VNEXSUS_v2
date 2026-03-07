import {
  caseAudienceSchema,
  caseCreateSchema,
  caseStatusSchema,
  caseUpdateSchema,
  documentCreateSchema,
  ocrJobCreateSchema,
  patientInputSchema
} from "@vnexus/shared";

export const caseAudienceContract = caseAudienceSchema;
export const caseStatusContract = caseStatusSchema;
export const caseCreateContract = caseCreateSchema;
export const caseUpdateContract = caseUpdateSchema;
export const patientInputContract = patientInputSchema;
export const documentCreateContract = documentCreateSchema;
export const ocrJobCreateContract = ocrJobCreateSchema;
