import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@vnexus/shared";
import { Readable } from "node:stream";

const {
  requireAuthorizedSessionMock,
  apiFailureMock,
  parseJsonBodyMock,
  parseAnalyticsExportQueryMock,
  exportAnalyticsMock
} = vi.hoisted(() => ({
  requireAuthorizedSessionMock: vi.fn(),
  apiFailureMock: vi.fn((error: unknown) => {
    if (error instanceof ApiError) {
      const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400;
      return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status });
    }

    return Response.json({ success: false, error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }),
  parseJsonBodyMock: vi.fn(),
  parseAnalyticsExportQueryMock: vi.fn(),
  exportAnalyticsMock: vi.fn()
}));

vi.mock("../../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  apiFailure: apiFailureMock,
  parseJsonBody: parseJsonBodyMock
}));

vi.mock("../../../../../lib/server/case-analytics-query", () => ({
  parseAnalyticsExportQuery: parseAnalyticsExportQueryMock
}));

vi.mock("../../../../../lib/server/services/case-analytics-service", () => ({
  exportAnalytics: exportAnalyticsMock
}));

import { GET, POST } from "./route";

describe("analytics export route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exportAnalyticsMock.mockResolvedValue({
      filename: "analytics-daily-20260311.csv",
      mimeType: "text/csv; charset=utf-8",
      size: 17,
      stream: Readable.from(["section,key,value"])
    });
  });

  it("downloads analytics export from query params", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "investigator" }
    });
    parseAnalyticsExportQueryMock.mockReturnValue({
      fileType: "csv",
      interval: "daily",
      filter: {}
    });

    const response = await GET(new Request("http://localhost/api/cases/analytics/export?fileType=csv"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toContain("analytics-daily-20260311.csv");
  });

  it("downloads analytics export from request body", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "admin" }
    });
    parseJsonBodyMock.mockResolvedValue({
      fileType: "xlsx",
      interval: "weekly",
      filter: { hospitals: ["Seoul Hospital"] }
    });
    exportAnalyticsMock.mockResolvedValue({
      filename: "analytics-weekly-20260311.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 4,
      stream: Readable.from([Buffer.from("xlsx")])
    });

    const response = await POST(new Request("http://localhost/api/cases/analytics/export", { method: "POST" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toContain("analytics-weekly-20260311.xlsx");
  });
});
