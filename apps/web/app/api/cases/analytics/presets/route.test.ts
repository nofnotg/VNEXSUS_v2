import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@vnexus/shared";

const {
  requireAuthorizedSessionMock,
  apiSuccessMock,
  apiFailureMock,
  parseJsonBodyMock,
  createPresetMock,
  getPresetsForUserMock,
  deletePresetMock
} = vi.hoisted(() => ({
  requireAuthorizedSessionMock: vi.fn(),
  apiSuccessMock: vi.fn((data: unknown, init?: ResponseInit) => Response.json({ success: true, data }, init)),
  apiFailureMock: vi.fn((error: unknown) => {
    if (error instanceof ApiError) {
      const status =
        error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : error.code === "CONFLICT" ? 409 : 400;
      return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status });
    }

    return Response.json({ success: false, error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }),
  parseJsonBodyMock: vi.fn(),
  createPresetMock: vi.fn(),
  getPresetsForUserMock: vi.fn(),
  deletePresetMock: vi.fn()
}));

vi.mock("../../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  apiSuccess: apiSuccessMock,
  apiFailure: apiFailureMock,
  parseJsonBody: parseJsonBodyMock
}));

vi.mock("../../../../../lib/server/services/analytics-preset-service", () => ({
  createPreset: createPresetMock,
  getPresetsForUser: getPresetsForUserMock,
  deletePreset: deletePresetMock
}));

import { DELETE, GET, POST } from "./route";

describe("analytics presets route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns presets for the current user", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "investigator" }
    });
    getPresetsForUserMock.mockResolvedValue([{ presetId: "preset-1", name: "Recent", userId: "user-1", filter: {}, interval: "daily", createdAt: "2026-03-10T00:00:00.000Z" }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.items).toHaveLength(1);
  });

  it("creates a preset", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "investigator" }
    });
    parseJsonBodyMock.mockResolvedValue({
      name: "Recent",
      filter: { hospitals: ["Seoul Hospital"] },
      interval: "weekly"
    });
    createPresetMock.mockResolvedValue({
      presetId: "preset-1",
      userId: "user-1",
      name: "Recent",
      filter: { hospitals: ["Seoul Hospital"] },
      interval: "weekly",
      createdAt: "2026-03-10T00:00:00.000Z"
    });

    const response = await POST(new Request("http://localhost/api/cases/analytics/presets", { method: "POST" }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createPresetMock).toHaveBeenCalledWith("user-1", {
      name: "Recent",
      filter: { hospitals: ["Seoul Hospital"] },
      interval: "weekly"
    });
    expect(body.data.name).toBe("Recent");
  });

  it("deletes a preset by id", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "admin" }
    });

    const response = await DELETE(new Request("http://localhost/api/cases/analytics/presets?presetId=preset-1", { method: "DELETE" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deletePresetMock).toHaveBeenCalledWith("user-1", "preset-1");
    expect(body.data.deleted).toBe(true);
  });

  it("rejects consumers", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-2", role: "consumer" }
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
