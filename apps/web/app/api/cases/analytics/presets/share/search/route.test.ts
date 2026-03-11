import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@vnexus/shared";

const { requireAuthorizedSessionMock, apiSuccessMock, apiFailureMock, searchShareCandidatesMock } = vi.hoisted(() => ({
  requireAuthorizedSessionMock: vi.fn(),
  apiSuccessMock: vi.fn((data: unknown, init?: ResponseInit) => Response.json({ success: true, data }, init)),
  apiFailureMock: vi.fn((error: unknown) => {
    if (error instanceof ApiError) {
      const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400;
      return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status });
    }

    return Response.json({ success: false, error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }),
  searchShareCandidatesMock: vi.fn()
}));

vi.mock("../../../../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  apiSuccess: apiSuccessMock,
  apiFailure: apiFailureMock
}));

vi.mock("../../../../../../../lib/server/services/analytics-preset-service", () => ({
  searchShareCandidates: searchShareCandidatesMock
}));

import { GET } from "./route";

describe("analytics preset share search route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns autocomplete candidates for investigators", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "investigator" }
    });
    searchShareCandidatesMock.mockResolvedValue([
      { userId: "user-2", email: "reviewer@example.com", displayName: "Reviewer" }
    ]);

    const response = await GET(new Request("http://localhost/api/cases/analytics/presets/share/search?q=rev"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.items).toHaveLength(1);
    expect(searchShareCandidatesMock).toHaveBeenCalledWith("user-1", "rev");
  });
});
