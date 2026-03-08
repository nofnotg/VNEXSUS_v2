import {
  apiErrorEnvelopeSchema,
  apiSuccessEnvelopeSchema,
  consumerNarrativeJsonSchema,
  investigatorNarrativeJsonSchema,
  type ConsumerNarrativeJson,
  type InvestigatorNarrativeJson
} from "@vnexus/shared";
import type { ZodType } from "zod";

export class NarrativeApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "NARRATIVE_API_ERROR"
  ) {
    super(message);
    this.name = "NarrativeApiError";
  }
}

async function fetchNarrative<T>(url: string, dataSchema: ZodType<T>) {
  const response = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store"
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = apiErrorEnvelopeSchema.safeParse(json);
    if (parsedError.success) {
      throw new NarrativeApiError(parsedError.data.error.message, response.status, parsedError.data.error.code);
    }

    throw new NarrativeApiError("Failed to load narrative", response.status);
  }

  const parsed = apiSuccessEnvelopeSchema(dataSchema).safeParse(json);
  if (!parsed.success) {
    throw new NarrativeApiError("Invalid narrative response", response.status, "INVALID_NARRATIVE_RESPONSE");
  }

  return parsed.data.data;
}

export function getInvestigatorNarrative(caseId: string): Promise<InvestigatorNarrativeJson> {
  return fetchNarrative(`/api/cases/${caseId}/reports/investigator/narrative`, investigatorNarrativeJsonSchema);
}

export function getConsumerNarrative(caseId: string): Promise<ConsumerNarrativeJson> {
  return fetchNarrative(`/api/cases/${caseId}/reports/consumer/narrative`, consumerNarrativeJsonSchema);
}
