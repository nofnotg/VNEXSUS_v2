import {
  ApiError,
  caseAnalyticsFilterSchema,
  caseAnalyticsTrendSchema,
  type CaseAnalyticsFilter,
  type CaseAnalyticsTrend
} from "@vnexus/shared";

function collectParam(searchParams: URLSearchParams, key: string) {
  const direct = searchParams.getAll(key);
  if (direct.length > 0) {
    return direct.flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  }

  const single = searchParams.get(key);
  return single ? single.split(",").map((value) => value.trim()).filter(Boolean) : [];
}

function formatDateInTimeZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function getDefaultAnalyticsFilter(timeZone = process.env.APP_TIMEZONE ?? "Asia/Seoul"): CaseAnalyticsFilter {
  const endDate = formatDateInTimeZone(new Date(), timeZone);
  const startDateSource = new Date(`${endDate}T12:00:00.000Z`);
  startDateSource.setUTCDate(startDateSource.getUTCDate() - 29);

  return {
    startDate: startDateSource.toISOString().slice(0, 10),
    endDate
  };
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

export function parseTrendInterval(searchParams: URLSearchParams): CaseAnalyticsTrend["interval"] {
  const value = searchParams.get("interval") ?? "daily";
  const parsed = caseAnalyticsTrendSchema.shape.interval.safeParse(value);

  if (!parsed.success) {
    throw new ApiError("VALIDATION_ERROR", "Invalid analytics trend interval", parsed.error.flatten());
  }

  return parsed.data;
}
