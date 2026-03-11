import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@vnexus/shared";

const { requireAuthorizedSessionMock, apiSuccessMock, apiFailureMock, parseJsonBodyMock, sharePresetMock } = vi.hoisted(() => ({
  requireAuthorizedSessionMock: vi.fn(),
  apiSuccessMock: vi.fn((data: unknown, init?: ResponseInit) => Response.json({ success: true, data }, init)),
  apiFailureMock: vi.fn((error: unknown) => {
    if (error instanceof ApiError) {
      const status =
        error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400;
      return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status });
    }

    return Response.json({ success: false, error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }),
  parseJsonBodyMock: vi.fn(),
  sharePresetMock: vi.fn()
}));

vi.mock("../../../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  apiSuccess: apiSuccessMock,
  apiFailure: apiFailureMock,
  parseJsonBody: parseJsonBodyMock
}));

vi.mock("../../../../../../lib/server/services/analytics-preset-service", () => ({
  sharePreset: sharePresetMock
}));

import { POST } from "./route";

describe("analytics preset share route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shares a preset for investigators", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "investigator" }
    });
    parseJsonBodyMock.mockResolvedValue({
      presetId: "preset-1",
      sharedWith: ["reviewer@example.com"]
    });

    const response = await POST(new Request("http://localhost/api/cases/analytics/presets/share", { method: "POST" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.shared).toBe(true);
    expect(sharePresetMock).toHaveBeenCalledWith("preset-1", "user-1", ["reviewer@example.com"]);
  });
});
