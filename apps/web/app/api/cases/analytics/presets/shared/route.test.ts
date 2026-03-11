import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@vnexus/shared";

const { requireAuthorizedSessionMock, apiSuccessMock, apiFailureMock, getSharedPresetsMock } = vi.hoisted(() => ({
  requireAuthorizedSessionMock: vi.fn(),
  apiSuccessMock: vi.fn((data: unknown, init?: ResponseInit) => Response.json({ success: true, data }, init)),
  apiFailureMock: vi.fn((error: unknown) => {
    if (error instanceof ApiError) {
      const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400;
      return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status });
    }

    return Response.json({ success: false, error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }),
  getSharedPresetsMock: vi.fn()
}));

vi.mock("../../../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  apiSuccess: apiSuccessMock,
  apiFailure: apiFailureMock
}));

vi.mock("../../../../../../lib/server/services/analytics-preset-service", () => ({
  getSharedPresets: getSharedPresetsMock
}));

import { GET } from "./route";

describe("shared analytics preset route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns shared presets for the signed-in user", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "admin" }
    });
    getSharedPresetsMock.mockResolvedValue([
      {
        presetId: "preset-1",
        userId: "user-2",
        name: "Team preset",
        filter: {},
        interval: "daily",
        isShared: true,
        sharedWith: ["admin@example.com"],
        createdAt: "2026-03-11T00:00:00.000Z"
      }
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.items).toHaveLength(1);
  });
});
