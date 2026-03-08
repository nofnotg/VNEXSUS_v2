import { apiErrorEnvelopeSchema, apiSuccessEnvelopeSchema, caseListJsonSchema, type CaseListJson } from "@vnexus/shared";

export class CaseListApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "CASE_LIST_API_ERROR"
  ) {
    super(message);
    this.name = "CaseListApiError";
  }
}

export async function getCaseList(): Promise<CaseListJson> {
  const response = await fetch("/api/cases/list", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store"
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = apiErrorEnvelopeSchema.safeParse(json);
    if (parsedError.success) {
      throw new CaseListApiError(parsedError.data.error.message, response.status, parsedError.data.error.code);
    }

    throw new CaseListApiError("Failed to load case list", response.status);
  }

  const parsed = apiSuccessEnvelopeSchema(caseListJsonSchema).safeParse(json);
  if (!parsed.success) {
    throw new CaseListApiError("Invalid case list response", response.status, "INVALID_CASE_LIST_RESPONSE");
  }

  return parsed.data.data;
}
