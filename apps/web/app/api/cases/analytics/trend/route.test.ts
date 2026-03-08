import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@vnexus/shared";

const { requireAuthorizedSessionMock, apiSuccessMock, apiFailureMock, getCaseAnalyticsTrendMock } = vi.hoisted(() => ({
  requireAuthorizedSessionMock: vi.fn(),
  apiSuccessMock: vi.fn((data: unknown, init?: ResponseInit) => Response.json({ success: true, data }, init)),
  apiFailureMock: vi.fn((error: unknown) => {
    if (error instanceof ApiError) {
      const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400;
      return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status });
    }

    return Response.json({ success: false, error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }),
  getCaseAnalyticsTrendMock: vi.fn()
}));

vi.mock("../../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  apiSuccess: apiSuccessMock,
  apiFailure: apiFailureMock
}));

vi.mock("../../../../../lib/server/services/case-analytics-service", () => ({
  getCaseAnalyticsTrend: getCaseAnalyticsTrendMock
}));

import { GET } from "./route";

describe("case analytics trend route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns trend data with filters", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "investigator" }
    });
    getCaseAnalyticsTrendMock.mockResolvedValue({
      interval: "weekly",
      points: [{ date: "2026-01-05", total: 3, confirmed: 2, unconfirmed: 1 }]
    });

    const response = await GET(
      new Request("http://localhost/api/cases/analytics/trend?interval=weekly&eventTypes=exam&hospitals=Seoul%20Hospital")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(getCaseAnalyticsTrendMock).toHaveBeenCalledWith(
      "user-1",
      "investigator",
      {
        eventTypes: ["exam"],
        hospitals: ["Seoul Hospital"]
      },
      "weekly"
    );
  });

  it("returns 400 for invalid interval", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "investigator" }
    });

    const response = await GET(new Request("http://localhost/api/cases/analytics/trend?interval=yearly"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
