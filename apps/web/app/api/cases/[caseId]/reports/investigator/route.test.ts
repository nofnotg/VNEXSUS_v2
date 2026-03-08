import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { ApiError } from "@vnexus/shared";

const { requireAuthorizedSessionMock, apiSuccessMock, apiFailureMock, getInvestigatorReportMock } = vi.hoisted(() => ({
  requireAuthorizedSessionMock: vi.fn(),
  apiSuccessMock: vi.fn((data: unknown, init?: ResponseInit) => Response.json({ success: true, data }, init)),
  apiFailureMock: vi.fn((error: unknown) => {
    if (error instanceof ApiError) {
      const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400;
      return Response.json({ success: false, code: error.code, message: error.message }, { status });
    }

    return Response.json({ success: false, code: "INTERNAL_ERROR" }, { status: 500 });
  }),
  getInvestigatorReportMock: vi.fn()
}));

vi.mock("../../../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  apiSuccess: apiSuccessMock,
  apiFailure: apiFailureMock
}));

vi.mock("../../../../../../lib/server/services/investigator-report-service", () => ({
  getInvestigatorReport: getInvestigatorReportMock
}));

import { GET } from "./route";

describe("investigator report route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns investigator report JSON for investigator users", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "investigator" }
    });
    getInvestigatorReportMock.mockResolvedValue({
      caseId: "case-1",
      generatedAt: "2026-03-08T00:00:00.000Z",
      requiresReview: false,
      sections: [
        {
          sectionTitle: "2024-03-07 | exam",
          entries: [
            { label: "Diagnosis", value: "Pneumonia" },
            { label: "Hospital", value: "Seoul Hospital" }
          ]
        }
      ]
    });

    const request = new Request("http://localhost/api/cases/case-1/reports/investigator") as NextRequest;
    const response = await GET(request, {
      params: Promise.resolve({ caseId: "case-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.caseId).toBe("case-1");
    expect(body.data.sections[0]?.sectionTitle).toBe("2024-03-07 | exam");
    expect(getInvestigatorReportMock).toHaveBeenCalledWith("case-1", "user-1", "investigator");
  });

  it("returns 403 when a non-investigator requests the investigator report", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-2", role: "consumer" }
    });

    const request = new Request("http://localhost/api/cases/case-1/reports/investigator") as NextRequest;
    const response = await GET(request, {
      params: Promise.resolve({ caseId: "case-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
    expect(getInvestigatorReportMock).not.toHaveBeenCalled();
  });

  it("returns 401 when there is no active session", async () => {
    requireAuthorizedSessionMock.mockRejectedValue(new ApiError("UNAUTHORIZED", "No active session"));

    const request = new Request("http://localhost/api/cases/case-1/reports/investigator") as NextRequest;
    const response = await GET(request, {
      params: Promise.resolve({ caseId: "case-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe("UNAUTHORIZED");
    expect(getInvestigatorReportMock).not.toHaveBeenCalled();
  });
});
