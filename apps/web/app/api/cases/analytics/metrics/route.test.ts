import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@vnexus/shared";

const { requireAuthorizedSessionMock, apiSuccessMock, apiFailureMock, getAnalyticsMetricsSnapshotMock, formatAnalyticsMetricsPrometheusMock, getAnalyticsObservabilityConfigMock, getPresetCacheStatsSnapshotMock } = vi.hoisted(() => ({
  requireAuthorizedSessionMock: vi.fn(),
  apiSuccessMock: vi.fn((data: unknown, init?: ResponseInit) => Response.json({ success: true, data }, init)),
  apiFailureMock: vi.fn((error: unknown) => {
    if (error instanceof ApiError) {
      const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400;
      return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status });
    }

    return Response.json({ success: false, error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }),
  getAnalyticsMetricsSnapshotMock: vi.fn(),
  formatAnalyticsMetricsPrometheusMock: vi.fn(),
  getAnalyticsObservabilityConfigMock: vi.fn(),
  getPresetCacheStatsSnapshotMock: vi.fn()
}));

vi.mock("../../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  apiSuccess: apiSuccessMock,
  apiFailure: apiFailureMock
}));

vi.mock("../../../../../lib/server/analytics-observability", () => ({
  getAnalyticsMetricsSnapshot: getAnalyticsMetricsSnapshotMock,
  formatAnalyticsMetricsPrometheus: formatAnalyticsMetricsPrometheusMock,
  getAnalyticsObservabilityConfig: getAnalyticsObservabilityConfigMock
}));

vi.mock("../../../../../lib/server/services/analytics-preset-cache", () => ({
  getPresetCacheStatsSnapshot: getPresetCacheStatsSnapshotMock
}));

import { GET } from "./route";

describe("analytics metrics route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns metrics for admins", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "admin-1", role: "admin" }
    });
    getAnalyticsMetricsSnapshotMock.mockReturnValue({
      export_request: { count: 3, failures: 1, bytes: 0, lastUpdatedAt: "2026-03-11T00:00:00.000Z" }
    });
    getPresetCacheStatsSnapshotMock.mockReturnValue({
      owned: { hits: 4, misses: 1, size: 1, ttlMs: 60000 },
      shared: { hits: 2, misses: 3, size: 1, ttlMs: 60000 }
    });
    getAnalyticsObservabilityConfigMock.mockReturnValue({
      slowQueryMs: 400
    });

    const response = await GET(new Request("http://localhost/api/cases/analytics/metrics"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.metrics.export_request.count).toBe(3);
    expect(body.data.cache.owned.hits).toBe(4);
  });

  it("returns prometheus metrics when requested", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "admin-1", role: "admin" }
    });
    formatAnalyticsMetricsPrometheusMock.mockReturnValue('analytics_operation_total{operation="export_request"} 3\n');

    const response = await GET(new Request("http://localhost/api/cases/analytics/metrics?format=prometheus"));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");
    expect(body).toContain('analytics_operation_total{operation="export_request"} 3');
  });
});
