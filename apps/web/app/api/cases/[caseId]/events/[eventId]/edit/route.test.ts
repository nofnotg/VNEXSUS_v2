import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { ApiError } from "@vnexus/shared";

const { requireAuthorizedSessionMock, parseJsonBodyMock, apiSuccessMock, apiFailureMock, updateEventDetailsMock } = vi.hoisted(
  () => ({
    requireAuthorizedSessionMock: vi.fn(),
    parseJsonBodyMock: vi.fn(),
    apiSuccessMock: vi.fn((data: unknown, init?: ResponseInit) => Response.json({ success: true, data }, init)),
    apiFailureMock: vi.fn((error: unknown) => {
      if (error instanceof ApiError) {
        const status =
          error.code === "UNAUTHORIZED"
            ? 401
            : error.code === "FORBIDDEN"
              ? 403
              : error.code === "CONFLICT"
                ? 409
                : error.code === "NOT_FOUND"
                  ? 404
                  : 400;
        return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status });
      }

      return Response.json({ success: false, error: { code: "INTERNAL_ERROR" } }, { status: 500 });
    }),
    updateEventDetailsMock: vi.fn()
  })
);

vi.mock("../../../../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  parseJsonBody: parseJsonBodyMock,
  apiSuccess: apiSuccessMock,
  apiFailure: apiFailureMock
}));

vi.mock("../../../../../../../lib/server/services/case-detail-service", () => ({
  updateEventDetails: updateEventDetailsMock
}));

import { PUT } from "./route";

describe("event edit route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates event details for investigator users", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "investigator" }
    });
    parseJsonBodyMock.mockResolvedValue({
      date: "2026-03-06",
      hospital: "Busan Hospital",
      details: "Revised detail",
      requiresReview: true
    });
    updateEventDetailsMock.mockResolvedValue({
      eventId: "event-1",
      date: "2026-03-06",
      hospital: "Busan Hospital",
      details: "Revised detail",
      requiresReview: true
    });

    const request = new Request("http://localhost/api/cases/case-1/events/event-1/edit", {
      method: "PUT",
      headers: {
        "x-event-last-edited-at": "2026-03-05T00:00:00.000Z"
      }
    }) as NextRequest;
    const response = await PUT(request, {
      params: Promise.resolve({ caseId: "case-1", eventId: "event-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updateEventDetailsMock).toHaveBeenCalledWith(
      "case-1",
      "user-1",
      "investigator",
      {
        eventId: "event-1",
        date: "2026-03-06",
        hospital: "Busan Hospital",
        details: "Revised detail",
        requiresReview: true
      },
      "2026-03-05T00:00:00.000Z"
    );
  });

  it("returns 403 for consumer edit requests", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-2", role: "consumer" }
    });
    parseJsonBodyMock.mockResolvedValue({
      details: "Revised detail"
    });
    updateEventDetailsMock.mockRejectedValue(new ApiError("FORBIDDEN", "This role cannot edit case events"));

    const request = new Request("http://localhost/api/cases/case-1/events/event-1/edit", { method: "PUT" }) as NextRequest;
    const response = await PUT(request, {
      params: Promise.resolve({ caseId: "case-1", eventId: "event-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
