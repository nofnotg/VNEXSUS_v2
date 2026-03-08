import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ApiError } from "@vnexus/shared";

const { requireAuthorizedSessionMock, apiSuccessMock, apiFailureMock, getInvestigatorNarrativeMock } = vi.hoisted(() => ({
  requireAuthorizedSessionMock: vi.fn(),
  apiSuccessMock: vi.fn((data: unknown, init?: ResponseInit) => Response.json({ success: true, data }, init)),
  apiFailureMock: vi.fn((error: unknown) => {
    if (error instanceof ApiError) {
      const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400;
      return Response.json({ success: false, code: error.code, message: error.message }, { status });
    }

    return Response.json({ success: false, code: "INTERNAL_ERROR" }, { status: 500 });
  }),
  getInvestigatorNarrativeMock: vi.fn()
}));

vi.mock("../../../../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  apiSuccess: apiSuccessMock,
  apiFailure: apiFailureMock
}));

vi.mock("../../../../../../../lib/server/services/investigator-narrative-service", () => ({
  getInvestigatorNarrative: getInvestigatorNarrativeMock
}));

import { GET } from "./route";

describe("investigator narrative route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns investigator narrative JSON for investigator users", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "investigator" }
    });
    getInvestigatorNarrativeMock.mockResolvedValue({
      caseId: "case-1",
      generatedAt: "2026-03-08T00:00:00.000Z",
      requiresReview: true,
      sections: [{ heading: "2024-03-07 | exam", paragraphs: ["exam narrative"], requiresReview: true }]
    });

    const request = new NextRequest("http://localhost/api/cases/case-1/reports/investigator/narrative?lang=ko");
    const response = await GET(request, {
      params: Promise.resolve({ caseId: "case-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.sections[0]?.heading).toBe("2024-03-07 | exam");
    expect(getInvestigatorNarrativeMock).toHaveBeenCalledWith("case-1", "user-1", "investigator", "ko");
  });

  it("returns 403 when a non-investigator requests the investigator narrative", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-2", role: "consumer" }
    });

    const request = new NextRequest("http://localhost/api/cases/case-1/reports/investigator/narrative");
    const response = await GET(request, {
      params: Promise.resolve({ caseId: "case-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
  });

  it("returns 400 for unsupported lang values", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "investigator" }
    });

    const request = new NextRequest("http://localhost/api/cases/case-1/reports/investigator/narrative?lang=jp");
    const response = await GET(request, {
      params: Promise.resolve({ caseId: "case-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
  });
});
