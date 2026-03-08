import {
  apiErrorEnvelopeSchema,
  apiSuccessEnvelopeSchema,
  consumerReportJsonSchema,
  investigatorReportJsonSchema,
  type ConsumerReportJson,
  type InvestigatorReportJson
} from "@vnexus/shared";
import type { ZodType } from "zod";

export class ReportApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "REPORT_API_ERROR"
  ) {
    super(message);
    this.name = "ReportApiError";
  }
}

async function fetchReport<T>(url: string, dataSchema: ZodType<T>) {
  const response = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store"
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = apiErrorEnvelopeSchema.safeParse(json);
    if (parsedError.success) {
      throw new ReportApiError(parsedError.data.error.message, response.status, parsedError.data.error.code);
    }

    throw new ReportApiError("Failed to load report", response.status);
  }

  const parsed = apiSuccessEnvelopeSchema(dataSchema).safeParse(json);
  if (!parsed.success) {
    throw new ReportApiError("Invalid report response", response.status, "INVALID_REPORT_RESPONSE");
  }

  return parsed.data.data;
}

export function getInvestigatorReport(caseId: string): Promise<InvestigatorReportJson> {
  return fetchReport(`/api/cases/${caseId}/reports/investigator`, investigatorReportJsonSchema);
}

export function getConsumerReport(caseId: string): Promise<ConsumerReportJson> {
  return fetchReport(`/api/cases/${caseId}/reports/consumer`, consumerReportJsonSchema);
}
