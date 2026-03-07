import { z } from "zod";
import { consumerSummarySchema } from "@vnexus/shared";

export const consumerSummaryContract = consumerSummarySchema;
export { consumerSummarySchema };

export const investigatorSlotSeedSchema = z.object({
  visitDateTime: z.array(z.string()).default([]),
  visitReason: z.array(z.string()).default([]),
  diagnoses: z.array(z.string()).default([]),
  examResults: z.array(z.string()).default([]),
  pathology: z.array(z.string()).default([]),
  treatments: z.array(z.string()).default([]),
  outpatientPeriod: z.array(z.string()).default([]),
  inpatientPeriod: z.array(z.string()).default([]),
  pastHistory: z.array(z.string()).default([]),
  doctorOpinion: z.array(z.string()).default([])
});
