import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { ApiError } from "@vnexus/shared";

const { requireAuthorizedSessionMock, parseJsonBodyMock, apiSuccessMock, apiFailureMock, updateEventConfirmationMock } = vi.hoisted(
  () => ({
    requireAuthorizedSessionMock: vi.fn(),
    parseJsonBodyMock: vi.fn(),
    apiSuccessMock: vi.fn((data: unknown, init?: ResponseInit) => Response.json({ success: true, data }, init)),
    apiFailureMock: vi.fn((error: unknown) => {
      if (error instanceof ApiError) {
        const status =
          error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400;
        return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status });
      }

      return Response.json({ success: false, error: { code: "INTERNAL_ERROR" } }, { status: 500 });
    }),
    updateEventConfirmationMock: vi.fn()
  })
);

vi.mock("../../../../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  parseJsonBody: parseJsonBodyMock,
  apiSuccess: apiSuccessMock,
  apiFailure: apiFailureMock
}));

vi.mock("../../../../../../../lib/server/services/case-detail-service", () => ({
  updateEventConfirmation: updateEventConfirmationMock
}));

import { PUT } from "./route";

describe("event confirmation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates confirmation for investigator users", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "investigator" }
    });
    parseJsonBodyMock.mockResolvedValue({ confirmed: true });

    const response = await PUT(new Request("http://localhost/api/cases/case-1/events/event-1/confirmation") as NextRequest, {
      params: Promise.resolve({ caseId: "case-1", eventId: "event-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.confirmed).toBe(true);
    expect(updateEventConfirmationMock).toHaveBeenCalledWith("case-1", "event-1", true, "user-1", "investigator");
  });

  it("returns 403 for consumer updates", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-2", role: "consumer" }
    });
    parseJsonBodyMock.mockResolvedValue({ confirmed: true });
    updateEventConfirmationMock.mockRejectedValue(new ApiError("FORBIDDEN", "This role cannot confirm case events"));

    const response = await PUT(new Request("http://localhost/api/cases/case-1/events/event-1/confirmation") as NextRequest, {
      params: Promise.resolve({ caseId: "case-1", eventId: "event-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
