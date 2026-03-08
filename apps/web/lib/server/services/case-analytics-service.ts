import { ApiError, caseAnalyticsSchema, type UserRole } from "@vnexus/shared";
import { caseAnalyticsRepository } from "../data-access/case-analytics-repository";

function toCountMap(items: Array<{ key: string; count: number }>) {
  return Object.fromEntries(
    [...items]
      .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
      .map((item) => [item.key, item.count])
  );
}

export async function getCaseAnalytics(
  userId: string,
  role: UserRole,
  repository: Pick<typeof caseAnalyticsRepository, "getAnalyticsForUser"> = caseAnalyticsRepository
) {
  if (!["investigator", "admin"].includes(role)) {
    throw new ApiError("FORBIDDEN", "This role cannot access case analytics");
  }

  const result = await repository.getAnalyticsForUser(userId, role === "admin");

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
