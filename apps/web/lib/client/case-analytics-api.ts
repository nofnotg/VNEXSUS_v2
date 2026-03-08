import {
  apiErrorEnvelopeSchema,
  apiSuccessEnvelopeSchema,
  caseAnalyticsFilterSchema,
  caseAnalyticsSchema,
  caseAnalyticsTrendSchema,
  type CaseAnalytics,
  type CaseAnalyticsFilter,
  type CaseAnalyticsTrend
} from "@vnexus/shared";

export class CaseAnalyticsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "CASE_ANALYTICS_API_ERROR"
  ) {
    super(message);
    this.name = "CaseAnalyticsApiError";
  }
}

function buildQuery(filter?: CaseAnalyticsFilter) {
  const parsed = caseAnalyticsFilterSchema.parse(filter ?? {});
  const searchParams = new URLSearchParams();

  if (parsed.startDate) {
    searchParams.set("startDate", parsed.startDate);
  }

  if (parsed.endDate) {
    searchParams.set("endDate", parsed.endDate);
  }

  for (const eventType of parsed.eventTypes ?? []) {
    searchParams.append("eventTypes", eventType);
  }

  for (const hospital of parsed.hospitals ?? []) {
    searchParams.append("hospitals", hospital);
  }

  return searchParams.toString();
}

async function parseError(response: Response) {
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = apiErrorEnvelopeSchema.safeParse(json);
    if (parsedError.success) {
      throw new CaseAnalyticsApiError(parsedError.data.error.message, response.status, parsedError.data.error.code);
    }

    throw new CaseAnalyticsApiError("Failed to load analytics", response.status);
  }

  return json;
}

export async function getCaseAnalytics(filter?: CaseAnalyticsFilter): Promise<CaseAnalytics> {
  const query = buildQuery(filter);
  const response = await fetch(query ? `/api/cases/analytics?${query}` : "/api/cases/analytics", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store"
  });

  const json = await parseError(response);
  const parsed = apiSuccessEnvelopeSchema(caseAnalyticsSchema).safeParse(json);

  if (!parsed.success) {
    throw new CaseAnalyticsApiError("Invalid analytics response", response.status, "INVALID_ANALYTICS_RESPONSE");
  }

  return parsed.data.data;
}

export async function getCaseAnalyticsTrend(
  filter: CaseAnalyticsFilter,
  interval: CaseAnalyticsTrend["interval"]
): Promise<CaseAnalyticsTrend> {
  const query = buildQuery(filter);
  const suffix = query ? `${query}&interval=${interval}` : `interval=${interval}`;
  const response = await fetch(`/api/cases/analytics/trend?${suffix}`, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store"
  });

  const json = await parseError(response);
  const parsed = apiSuccessEnvelopeSchema(caseAnalyticsTrendSchema).safeParse(json);

  if (!parsed.success) {
    throw new CaseAnalyticsApiError("Invalid analytics trend response", response.status, "INVALID_ANALYTICS_RESPONSE");
  }

  return parsed.data.data;
}
