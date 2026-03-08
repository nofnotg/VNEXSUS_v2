import {
  apiErrorEnvelopeSchema,
  apiSuccessEnvelopeSchema,
  consumerNarrativeJsonSchema,
  investigatorNarrativeJsonSchema,
  type LocaleCode,
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

function withLang(url: string, lang?: LocaleCode) {
  if (!lang) {
    return url;
  }

  const searchParams = new URLSearchParams({ lang });
  return `${url}?${searchParams.toString()}`;
}

export function getInvestigatorNarrative(caseId: string, lang?: LocaleCode): Promise<InvestigatorNarrativeJson> {
  return fetchNarrative(withLang(`/api/cases/${caseId}/reports/investigator/narrative`, lang), investigatorNarrativeJsonSchema);
}

export function getConsumerNarrative(caseId: string, lang?: LocaleCode): Promise<ConsumerNarrativeJson> {
  return fetchNarrative(withLang(`/api/cases/${caseId}/reports/consumer/narrative`, lang), consumerNarrativeJsonSchema);
}
