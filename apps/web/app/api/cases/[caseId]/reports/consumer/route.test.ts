import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { ApiError } from "@vnexus/shared";

const { requireAuthorizedSessionMock, apiSuccessMock, apiFailureMock, getConsumerReportMock } = vi.hoisted(() => ({
  requireAuthorizedSessionMock: vi.fn(),
  apiSuccessMock: vi.fn((data: unknown, init?: ResponseInit) => Response.json({ success: true, data }, init)),
  apiFailureMock: vi.fn((error: unknown) => {
    if (error instanceof ApiError) {
      const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400;
      return Response.json({ success: false, code: error.code, message: error.message }, { status });
    }

    return Response.json({ success: false, code: "INTERNAL_ERROR" }, { status: 500 });
  }),
  getConsumerReportMock: vi.fn()
}));

vi.mock("../../../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  apiSuccess: apiSuccessMock,
  apiFailure: apiFailureMock
}));

vi.mock("../../../../../../lib/server/services/consumer-report-service", () => ({
  getConsumerReport: getConsumerReportMock
}));

import { GET } from "./route";

describe("consumer report route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns consumer report JSON for consumer users", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "consumer" }
    });
    getConsumerReportMock.mockResolvedValue({
      caseId: "case-1",
      generatedAt: "2026-03-08T00:00:00.000Z",
      requiresReview: true,
      sections: [
        {
          sectionTitle: "timeline_summary",
          timeline: [
            {
              canonicalDate: "2024-03-07",
              hospital: "Seoul Hospital",
              diagnosis: "Pneumonia"
            }
          ]
        },
        {
          sectionTitle: "guidance",
          checkPoints: ["review_required_bundle_exists"],
          nextActions: ["review_original_documents"]
        }
      ]
    });

    const request = new Request("http://localhost/api/cases/case-1/reports/consumer") as NextRequest;
    const response = await GET(request, {
      params: Promise.resolve({ caseId: "case-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.caseId).toBe("case-1");
    expect(body.data.sections[0]?.sectionTitle).toBe("timeline_summary");
    expect(getConsumerReportMock).toHaveBeenCalledWith("case-1", "user-1", "consumer");
  });

  it("returns 403 when a non-consumer requests the consumer report", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-2", role: "investigator" }
    });

    const request = new Request("http://localhost/api/cases/case-1/reports/consumer") as NextRequest;
    const response = await GET(request, {
      params: Promise.resolve({ caseId: "case-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
    expect(getConsumerReportMock).not.toHaveBeenCalled();
  });

  it("returns 401 when there is no active session", async () => {
    requireAuthorizedSessionMock.mockRejectedValue(new ApiError("UNAUTHORIZED", "No active session"));

    const request = new Request("http://localhost/api/cases/case-1/reports/consumer") as NextRequest;
    const response = await GET(request, {
      params: Promise.resolve({ caseId: "case-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe("UNAUTHORIZED");
    expect(getConsumerReportMock).not.toHaveBeenCalled();
  });
});
