import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@vnexus/shared";

const { requireAuthorizedSessionMock, parseJsonBodyMock, apiSuccessMock, apiFailureMock, updateUserPreferencesMock } =
  vi.hoisted(() => ({
    requireAuthorizedSessionMock: vi.fn(),
    parseJsonBodyMock: vi.fn(),
    apiSuccessMock: vi.fn((data: unknown, init?: ResponseInit) => Response.json({ success: true, data }, init)),
    apiFailureMock: vi.fn((error: unknown) => {
      if (error instanceof ApiError) {
        const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400;
        return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status });
      }

      return Response.json({ success: false, error: { code: "INTERNAL_ERROR" } }, { status: 500 });
    }),
    updateUserPreferencesMock: vi.fn()
  }));

vi.mock("../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  parseJsonBody: parseJsonBodyMock,
  apiSuccess: apiSuccessMock,
  apiFailure: apiFailureMock
}));

vi.mock("../../../../lib/server/services/user-preferences-service", () => ({
  updateUserPreferences: updateUserPreferencesMock
}));

import { PUT } from "./route";

describe("user preferences route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates preferences for the authenticated user", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "consumer" }
    });
    parseJsonBodyMock.mockResolvedValue({ locale: "ko", theme: "dark" });
    updateUserPreferencesMock.mockResolvedValue({ locale: "ko", theme: "dark" });

    const response = await PUT(new NextRequest("http://localhost/api/user/preferences", { method: "PUT" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updateUserPreferencesMock).toHaveBeenCalledWith("user-1", { locale: "ko", theme: "dark" });
  });
});
