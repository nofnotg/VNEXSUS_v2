import { ApiError, caseAnalyticsFilterSchema, caseAnalyticsTrendSchema, type CaseAnalyticsFilter } from "@vnexus/shared";

function collectParam(searchParams: URLSearchParams, key: string) {
  const direct = searchParams.getAll(key);
  if (direct.length > 0) {
    return direct.flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  }

  const single = searchParams.get(key);
  return single ? single.split(",").map((value) => value.trim()).filter(Boolean) : [];
}

export function parseCaseAnalyticsFilter(searchParams: URLSearchParams): CaseAnalyticsFilter {
  const parsed = caseAnalyticsFilterSchema.safeParse({
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
    eventTypes: collectParam(searchParams, "eventTypes"),
    hospitals: collectParam(searchParams, "hospitals")
  });

  if (!parsed.success) {
    throw new ApiError("VALIDATION_ERROR", "Invalid analytics filter", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseTrendInterval(searchParams: URLSearchParams) {
  const value = searchParams.get("interval") ?? "daily";
  const parsed = caseAnalyticsTrendSchema.shape.interval.safeParse(value);

  if (!parsed.success) {
    throw new ApiError("VALIDATION_ERROR", "Invalid analytics trend interval", parsed.error.flatten());
  }

  return parsed.data;
}
