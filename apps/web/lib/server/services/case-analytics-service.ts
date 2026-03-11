import {
  ApiError,
  analyticsExportFileTypeSchema,
  analyticsIntervalSchema,
  caseAnalyticsFilterSchema,
  caseAnalyticsSchema,
  caseAnalyticsTrendSchema,
  type AnalyticsExportFileType,
  type CaseAnalyticsFilter,
  type CaseAnalyticsTrend,
  type UserRole
} from "@vnexus/shared";
import { caseAnalyticsRepository } from "../data-access/case-analytics-repository";
import { Parser as Json2CsvParser } from "json2csv";
import * as xlsx from "xlsx";

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

function buildTimestamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function buildExportRows(analytics: Awaited<ReturnType<typeof getCaseAnalytics>>, trend: CaseAnalyticsTrend) {
  return [
    { section: "summary", key: "totalCases", value: analytics.totalCases, total: "", confirmed: "", unconfirmed: "" },
    { section: "summary", key: "totalEvents", value: analytics.totalEvents, total: "", confirmed: "", unconfirmed: "" },
    { section: "summary", key: "confirmedEvents", value: analytics.confirmedEvents, total: "", confirmed: "", unconfirmed: "" },
    { section: "summary", key: "unconfirmedEvents", value: analytics.unconfirmedEvents, total: "", confirmed: "", unconfirmed: "" },
    { section: "summary", key: "reviewRequiredEvents", value: analytics.reviewRequiredEvents, total: "", confirmed: "", unconfirmed: "" },
    ...Object.entries(analytics.eventsByType).map(([key, value]) => ({
      section: "eventType",
      key,
      value,
      total: "",
      confirmed: "",
      unconfirmed: ""
    })),
    ...Object.entries(analytics.eventsByHospital).map(([key, value]) => ({
      section: "hospital",
      key,
      value,
      total: "",
      confirmed: "",
      unconfirmed: ""
    })),
    ...trend.points.map((point) => ({
      section: "trend",
      key: point.date,
      value: point.total,
      total: point.total,
      confirmed: point.confirmed,
      unconfirmed: point.unconfirmed
    }))
  ];
}

function toWorkbook(
  analytics: Awaited<ReturnType<typeof getCaseAnalytics>>,
  trend: CaseAnalyticsTrend,
  filter: CaseAnalyticsFilter,
  interval: CaseAnalyticsTrend["interval"]
) {
  const workbook = xlsx.utils.book_new();

  xlsx.utils.book_append_sheet(
    workbook,
    xlsx.utils.json_to_sheet([
      { metric: "totalCases", value: analytics.totalCases },
      { metric: "totalEvents", value: analytics.totalEvents },
      { metric: "confirmedEvents", value: analytics.confirmedEvents },
      { metric: "unconfirmedEvents", value: analytics.unconfirmedEvents },
      { metric: "reviewRequiredEvents", value: analytics.reviewRequiredEvents }
    ]),
    "Summary"
  );

  xlsx.utils.book_append_sheet(
    workbook,
    xlsx.utils.json_to_sheet(trend.points),
    "Trend"
  );

  xlsx.utils.book_append_sheet(
    workbook,
    xlsx.utils.json_to_sheet(
      Object.entries(analytics.eventsByType).map(([eventType, count]) => ({
        eventType,
        count
      }))
    ),
    "EventTypes"
  );

  xlsx.utils.book_append_sheet(
    workbook,
    xlsx.utils.json_to_sheet(
      Object.entries(analytics.eventsByHospital).map(([hospital, count]) => ({
        hospital,
        count
      }))
    ),
    "Hospitals"
  );

  xlsx.utils.book_append_sheet(
    workbook,
    xlsx.utils.json_to_sheet([
      { key: "startDate", value: filter.startDate ?? "" },
      { key: "endDate", value: filter.endDate ?? "" },
      { key: "eventTypes", value: (filter.eventTypes ?? []).join(", ") },
      { key: "hospitals", value: (filter.hospitals ?? []).join(", ") },
      { key: "interval", value: interval }
    ]),
    "Filters"
  );

  return workbook;
}

export type AnalyticsExportFile = {
  filename: string;
  mimeType: string;
  buffer: Buffer;
};

type AnalyticsRepository = Pick<
  typeof caseAnalyticsRepository,
  "getAnalyticsForUser" | "getTrendForUser" | "getTopHospitalsForUser"
>;

export async function getCaseAnalytics(
  userId: string,
  role: UserRole,
  filter?: CaseAnalyticsFilter,
  repository: AnalyticsRepository = caseAnalyticsRepository
) {
  assertAnalyticsRole(role);

  const parsedFilter = normalizeFilter(filter);
  const [result, topHospitals] = await Promise.all([
    repository.getAnalyticsForUser(userId, role === "admin", parsedFilter),
    repository.getTopHospitalsForUser(userId, role === "admin", parsedFilter, 5)
  ]);

  return caseAnalyticsSchema.parse({
    totalCases: result.totalCases,
    totalEvents: result.totalEvents,
    confirmedEvents: result.confirmedEvents,
    unconfirmedEvents: result.unconfirmedEvents,
    reviewRequiredEvents: result.reviewRequiredEvents,
    eventsByType: toCountMap(result.eventsByType),
    eventsByHospital: toCountMap(result.eventsByHospital.slice(0, 8)),
    topHospitals
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

const MAX_EXPORT_ROWS = 10000;

export async function exportAnalytics(
  userId: string,
  role: UserRole,
  filter: CaseAnalyticsFilter,
  interval: CaseAnalyticsTrend["interval"],
  fileType: AnalyticsExportFileType,
  repository: AnalyticsRepository = caseAnalyticsRepository
): Promise<AnalyticsExportFile> {
  assertAnalyticsRole(role);

  const parsedFilter = normalizeFilter(filter);
  const parsedInterval = analyticsIntervalSchema.parse(interval);
  const parsedFileType = analyticsExportFileTypeSchema.parse(fileType);

  const [analytics, trend] = await Promise.all([
    getCaseAnalytics(userId, role, parsedFilter, repository),
    getCaseAnalyticsTrend(userId, role, parsedFilter, parsedInterval, repository)
  ]);

  const rows = buildExportRows(analytics, trend);
  if (rows.length > MAX_EXPORT_ROWS) {
    throw new ApiError("VALIDATION_ERROR", "Analytics export exceeds the maximum row limit");
  }

  const baseFilename = `analytics-${parsedInterval}-${buildTimestamp()}`;

  if (parsedFileType === "csv") {
    const parser = new Json2CsvParser({
      fields: ["section", "key", "value", "total", "confirmed", "unconfirmed"]
    });
    const csv = parser.parse(rows);

    return {
      filename: `${baseFilename}.csv`,
      mimeType: "text/csv; charset=utf-8",
      buffer: Buffer.from(csv, "utf8")
    };
  }

  const workbook = toWorkbook(analytics, trend, parsedFilter, parsedInterval);
  const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return {
    filename: `${baseFilename}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer
  };
}
