import { apiErrorEnvelopeSchema, apiSuccessEnvelopeSchema, caseDetailSchema, type CaseDetail } from "@vnexus/shared";

export class CaseDetailApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "CASE_DETAIL_API_ERROR"
  ) {
    super(message);
    this.name = "CaseDetailApiError";
  }
}

export async function getCaseDetail(caseId: string): Promise<CaseDetail> {
  const response = await fetch(`/api/cases/${caseId}/detail`, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store"
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = apiErrorEnvelopeSchema.safeParse(json);
    if (parsedError.success) {
      throw new CaseDetailApiError(parsedError.data.error.message, response.status, parsedError.data.error.code);
    }

    throw new CaseDetailApiError("Failed to load case detail", response.status);
  }

  const parsed = apiSuccessEnvelopeSchema(caseDetailSchema).safeParse(json);
  if (!parsed.success) {
    throw new CaseDetailApiError("Invalid case detail response", response.status, "INVALID_CASE_DETAIL_RESPONSE");
  }

  return parsed.data.data;
}

export async function updateCaseEventConfirmation(caseId: string, eventId: string, confirmed: boolean) {
  const response = await fetch(`/api/cases/${caseId}/events/${eventId}/confirmation`, {
    method: "PUT",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ confirmed })
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = apiErrorEnvelopeSchema.safeParse(json);
    if (parsedError.success) {
      throw new CaseDetailApiError(parsedError.data.error.message, response.status, parsedError.data.error.code);
    }

    throw new CaseDetailApiError("Failed to update event confirmation", response.status);
  }

  return json;
}
