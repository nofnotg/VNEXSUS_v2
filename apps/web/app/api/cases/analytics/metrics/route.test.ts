import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@vnexus/shared";

const { requireAuthorizedSessionMock, apiSuccessMock, apiFailureMock, getAnalyticsMetricsSnapshotMock } = vi.hoisted(() => ({
  requireAuthorizedSessionMock: vi.fn(),
  apiSuccessMock: vi.fn((data: unknown, init?: ResponseInit) => Response.json({ success: true, data }, init)),
  apiFailureMock: vi.fn((error: unknown) => {
    if (error instanceof ApiError) {
      const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400;
      return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status });
    }

    return Response.json({ success: false, error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }),
  getAnalyticsMetricsSnapshotMock: vi.fn()
}));

vi.mock("../../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  apiSuccess: apiSuccessMock,
  apiFailure: apiFailureMock
}));

vi.mock("../../../../../lib/server/analytics-observability", () => ({
  getAnalyticsMetricsSnapshot: getAnalyticsMetricsSnapshotMock
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

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.export_request.count).toBe(3);
  });
});
