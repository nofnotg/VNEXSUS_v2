import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@vnexus/shared";

const { requireAuthorizedSessionMock, apiSuccessMock, apiFailureMock, getCaseAnalyticsMock } = vi.hoisted(() => ({
  requireAuthorizedSessionMock: vi.fn(),
  apiSuccessMock: vi.fn((data: unknown, init?: ResponseInit) => Response.json({ success: true, data }, init)),
  apiFailureMock: vi.fn((error: unknown) => {
    if (error instanceof ApiError) {
      const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400;
      return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status });
    }

    return Response.json({ success: false, error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }),
  getCaseAnalyticsMock: vi.fn()
}));

vi.mock("../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  apiSuccess: apiSuccessMock,
  apiFailure: apiFailureMock
}));

vi.mock("../../../../lib/server/services/case-analytics-service", () => ({
  getCaseAnalytics: getCaseAnalyticsMock
}));

import { GET } from "./route";

describe("case analytics route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns analytics for investigators", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "investigator" }
    });
    getCaseAnalyticsMock.mockResolvedValue({
      totalCases: 3,
      totalEvents: 8,
      confirmedEvents: 5,
      unconfirmedEvents: 3,
      reviewRequiredEvents: 2,
      eventsByType: { exam: 4 },
      eventsByHospital: { "Seoul Hospital": 5 }
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalCases).toBe(3);
    expect(getCaseAnalyticsMock).toHaveBeenCalledWith("user-1", "investigator");
  });

  it("returns 403 for consumers", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-2", role: "consumer" }
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
