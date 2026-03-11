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
import { Transform as Json2CsvTransform } from "json2csv";
import * as xlsx from "xlsx";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { logAnalyticsEvent, measureAnalyticsOperation, recordAnalyticsMetric } from "../analytics-observability";

const MAX_EXPORT_ROWS = 10000;
const MAX_EXPORT_DAYS = Number(process.env.ANALYTICS_EXPORT_MAX_DAYS ?? 366);
const MAX_EXPORT_FILTER_VALUES = Number(process.env.ANALYTICS_EXPORT_MAX_FILTER_VALUES ?? 20);

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
  size: number;
  stream: Readable;
};

type AnalyticsRepository = Pick<
  typeof caseAnalyticsRepository,
  "getAnalyticsForUser" | "getTrendForUser" | "getTopHospitalsForUser" | "getAccessibleFilterValues"
>;

async function ensureExportScope(
  userId: string,
  role: UserRole,
  filter: CaseAnalyticsFilter,
  repository: AnalyticsRepository
) {
  const normalized = normalizeFilter(filter);
  if (normalized.startDate && normalized.endDate) {
    const start = new Date(`${normalized.startDate}T00:00:00.000Z`);
    const end = new Date(`${normalized.endDate}T00:00:00.000Z`);
    const diffDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000);

    if (diffDays > MAX_EXPORT_DAYS) {
      throw new ApiError("VALIDATION_ERROR", `Analytics export date range cannot exceed ${MAX_EXPORT_DAYS} days`);
    }
  }

  if ((normalized.eventTypes?.length ?? 0) > MAX_EXPORT_FILTER_VALUES || (normalized.hospitals?.length ?? 0) > MAX_EXPORT_FILTER_VALUES) {
    throw new ApiError("VALIDATION_ERROR", "Analytics export filter is too broad");
  }

  const accessible = await measureAnalyticsOperation(
    "analytics.export.scope_lookup",
    () => repository.getAccessibleFilterValues(userId, role === "admin"),
    {
      payload: {
        role,
        requestedEventTypeCount: normalized.eventTypes?.length ?? 0,
        requestedHospitalCount: normalized.hospitals?.length ?? 0
      }
    }
  );
  const allowedEventTypes = new Set<string>(accessible.eventTypes);
  const allowedHospitals = new Set<string>(accessible.hospitals);

  const invalidEventTypes = (normalized.eventTypes ?? []).filter((value) => !allowedEventTypes.has(value));
  const invalidHospitals = (normalized.hospitals ?? []).filter((value) => !allowedHospitals.has(value));

  if (invalidEventTypes.length > 0 || invalidHospitals.length > 0) {
    throw new ApiError("FORBIDDEN", "Export filter contains values outside the accessible scope", {
      invalidEventTypes,
      invalidHospitals
    });
  }
}

async function createExportWorkspace() {
  return mkdtemp(join(tmpdir(), "vnexus-analytics-"));
}

async function buildCsvExportFile(rows: ReturnType<typeof buildExportRows>, filePath: string) {
  const transform = new Json2CsvTransform(
    {
      fields: ["section", "key", "value", "total", "confirmed", "unconfirmed"]
    },
    { objectMode: true }
  );

  await pipeline(Readable.from(rows, { objectMode: true }), transform as never, createWriteStream(filePath, { encoding: "utf8" }));
}

async function buildXlsxExportFile(
  analytics: Awaited<ReturnType<typeof getCaseAnalytics>>,
  trend: CaseAnalyticsTrend,
  filter: CaseAnalyticsFilter,
  interval: CaseAnalyticsTrend["interval"],
  filePath: string
) {
  const workbook = toWorkbook(analytics, trend, filter, interval);
  xlsx.writeFile(workbook, filePath, { bookType: "xlsx" });
}

async function toStreamedExportFile(
  filePath: string,
  filename: string,
  mimeType: string
): Promise<AnalyticsExportFile> {
  const fileStat = await stat(filePath);
  const stream = createReadStream(filePath);
  const cleanup = () => void rm(filePath, { force: true }).catch(() => undefined);

  stream.once("close", cleanup);
  stream.once("error", cleanup);

  return {
    filename,
    mimeType,
    size: fileStat.size,
    stream
  };
}

export async function getCaseAnalytics(
  userId: string,
  role: UserRole,
  filter?: CaseAnalyticsFilter,
  repository: AnalyticsRepository = caseAnalyticsRepository
) {
  assertAnalyticsRole(role);

  const parsedFilter = normalizeFilter(filter);
  const [result, topHospitals] = await Promise.all([
    measureAnalyticsOperation(
      "analytics.query.case_analytics",
      () => repository.getAnalyticsForUser(userId, role === "admin", parsedFilter),
      {
        metricKey: "query_case_analytics",
        payload: {
          role,
          filterEventTypeCount: parsedFilter.eventTypes?.length ?? 0,
          filterHospitalCount: parsedFilter.hospitals?.length ?? 0
        }
      }
    ),
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
  const trend = await measureAnalyticsOperation(
    "analytics.query.case_analytics_trend",
    () => repository.getTrendForUser(userId, role === "admin", parsedFilter, interval),
    {
      metricKey: "query_case_analytics_trend",
      payload: {
        role,
        interval,
        filterEventTypeCount: parsedFilter.eventTypes?.length ?? 0,
        filterHospitalCount: parsedFilter.hospitals?.length ?? 0
      }
    }
  );
  return caseAnalyticsTrendSchema.parse(trend);
}

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
  const exportStartedAt = Date.now();

  try {
    await ensureExportScope(userId, role, parsedFilter, repository);
    recordAnalyticsMetric("export_request");
    logAnalyticsEvent("analytics.export.requested", {
      role,
      fileType: parsedFileType,
      interval: parsedInterval,
      filterEventTypeCount: parsedFilter.eventTypes?.length ?? 0,
      filterHospitalCount: parsedFilter.hospitals?.length ?? 0
    });

    const [analytics, trend] = await Promise.all([
      getCaseAnalytics(userId, role, parsedFilter, repository),
      getCaseAnalyticsTrend(userId, role, parsedFilter, parsedInterval, repository)
    ]);

    const rows = buildExportRows(analytics, trend);
    if (rows.length > MAX_EXPORT_ROWS) {
      throw new ApiError("VALIDATION_ERROR", "Analytics export exceeds the maximum row limit");
    }

    const baseFilename = `analytics-${parsedInterval}-${buildTimestamp()}`;
    const workspace = await createExportWorkspace();

    if (parsedFileType === "csv") {
      const filePath = join(workspace, `${baseFilename}.csv`);
      await measureAnalyticsOperation(
        "analytics.export.csv_build",
        () => buildCsvExportFile(rows, filePath),
        {
          payload: { fileType: parsedFileType, rows: rows.length },
          rows: rows.length
        }
      );
      const exportFile = await toStreamedExportFile(filePath, `${baseFilename}.csv`, "text/csv; charset=utf-8");
      recordAnalyticsMetric("export_complete", { bytes: exportFile.size, durationMs: Date.now() - exportStartedAt, rows: rows.length });
      logAnalyticsEvent("analytics.export.completed", {
        fileType: parsedFileType,
        size: exportFile.size,
        durationMs: Date.now() - exportStartedAt,
        rows: rows.length
      });

      return exportFile;
    }

    const filePath = join(workspace, `${baseFilename}.xlsx`);
    await measureAnalyticsOperation(
      "analytics.export.xlsx_build",
      () => buildXlsxExportFile(analytics, trend, parsedFilter, parsedInterval, filePath),
      {
        payload: { fileType: parsedFileType, rows: rows.length },
        rows: rows.length
      }
    );
    const exportFile = await toStreamedExportFile(
      filePath,
      `${baseFilename}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    recordAnalyticsMetric("export_complete", { bytes: exportFile.size, durationMs: Date.now() - exportStartedAt, rows: rows.length });
    logAnalyticsEvent("analytics.export.completed", {
      fileType: parsedFileType,
      size: exportFile.size,
      durationMs: Date.now() - exportStartedAt,
      rows: rows.length
    });

    return exportFile;
  } catch (error) {
    recordAnalyticsMetric("export_request", { failed: true, durationMs: Date.now() - exportStartedAt });
    logAnalyticsEvent(
      "analytics.export.failed",
      {
        fileType: parsedFileType,
        interval: parsedInterval,
        durationMs: Date.now() - exportStartedAt,
        errorMessage: error instanceof Error ? error.message : "Unknown analytics export error"
      },
      "error"
    );
    throw error;
  }
}
