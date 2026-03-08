import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { ApiError } from "@vnexus/shared";

const { requireAuthorizedSessionMock, apiSuccessMock, apiFailureMock, getCaseDetailMock } = vi.hoisted(() => ({
  requireAuthorizedSessionMock: vi.fn(),
  apiSuccessMock: vi.fn((data: unknown, init?: ResponseInit) => Response.json({ success: true, data }, init)),
  apiFailureMock: vi.fn((error: unknown) => {
    if (error instanceof ApiError) {
      const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400;
      return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status });
    }

    return Response.json({ success: false, error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }),
  getCaseDetailMock: vi.fn()
}));

vi.mock("../../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  apiSuccess: apiSuccessMock,
  apiFailure: apiFailureMock
}));

vi.mock("../../../../../lib/server/services/case-detail-service", () => ({
  getCaseDetail: getCaseDetailMock
}));

import { GET } from "./route";

describe("case detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns case detail for authorized users", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "consumer" }
    });
    getCaseDetailMock.mockResolvedValue({
      caseId: "case-1",
      hospitalName: "Seoul Hospital",
      events: []
    });

    const response = await GET(new Request("http://localhost/api/cases/case-1/detail") as NextRequest, {
      params: Promise.resolve({ caseId: "case-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.caseId).toBe("case-1");
    expect(getCaseDetailMock).toHaveBeenCalledWith("case-1", "user-1", "consumer");
  });

  it("returns 403 for forbidden roles", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "guest" }
    });
    getCaseDetailMock.mockRejectedValue(new ApiError("FORBIDDEN", "This role cannot open case detail"));

    const response = await GET(new Request("http://localhost/api/cases/case-1/detail") as NextRequest, {
      params: Promise.resolve({ caseId: "case-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
