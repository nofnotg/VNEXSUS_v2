import {
  ApiError,
  caseAnalyticsFilterSchema,
  caseAnalyticsSchema,
  caseAnalyticsTrendSchema,
  type CaseAnalyticsFilter,
  type CaseAnalyticsTrend,
  type UserRole
} from "@vnexus/shared";
import { caseAnalyticsRepository } from "../data-access/case-analytics-repository";

function toCountMap(items: Array<{ key: string; count: number }>) {
  return Object.fromEntries(
    [...items]
      .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
      .map((item) => [item.key, item.count])
  );
}

function assertAnalyticsRole(role: UserRole) {
  if (!["investigator", "admin"].includes(role)) {
    throw new ApiError("FORBIDDEN", "This role cannot access case analytics");
  }
}

function normalizeFilter(filter?: CaseAnalyticsFilter) {
  return caseAnalyticsFilterSchema.parse(filter ?? {});
}

type AnalyticsRepository = Pick<typeof caseAnalyticsRepository, "getAnalyticsForUser" | "getTrendForUser">;

export async function getCaseAnalytics(
  userId: string,
  role: UserRole,
  filter?: CaseAnalyticsFilter,
  repository: AnalyticsRepository = caseAnalyticsRepository
) {
  assertAnalyticsRole(role);

  const parsedFilter = normalizeFilter(filter);
  const result = await repository.getAnalyticsForUser(userId, role === "admin", parsedFilter);

  return caseAnalyticsSchema.parse({
    totalCases: result.totalCases,
    totalEvents: result.totalEvents,
    confirmedEvents: result.confirmedEvents,
    unconfirmedEvents: result.unconfirmedEvents,
    reviewRequiredEvents: result.reviewRequiredEvents,
    eventsByType: toCountMap(result.eventsByType),
    eventsByHospital: toCountMap(result.eventsByHospital.slice(0, 8))
  });
}

export async function getCaseAnalyticsTrend(
  userId: string,
  role: UserRole,
  filter: CaseAnalyticsFilter,
  interval: CaseAnalyticsTrend["interval"],
  repository: AnalyticsRepository = caseAnalyticsRepository
) {
  assertAnalyticsRole(role);

  const parsedFilter = normalizeFilter(filter);
  const trend = await repository.getTrendForUser(userId, role === "admin", parsedFilter, interval);
  return caseAnalyticsTrendSchema.parse(trend);
}
