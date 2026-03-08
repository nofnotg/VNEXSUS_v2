import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { ApiError } from "@vnexus/shared";

const { requireAuthorizedSessionMock, apiFailureMock, exportConsumerNarrativePdfMock } = vi.hoisted(() => ({
  requireAuthorizedSessionMock: vi.fn(),
  apiFailureMock: vi.fn((error: unknown) => {
    if (error instanceof ApiError) {
      const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400;
      return Response.json({ success: false, code: error.code, message: error.message }, { status });
    }

    return Response.json({ success: false, code: "INTERNAL_ERROR" }, { status: 500 });
  }),
  exportConsumerNarrativePdfMock: vi.fn()
}));

vi.mock("../../../../../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  apiFailure: apiFailureMock
}));

vi.mock("../../../../../../../../lib/server/services/consumer-report-export-service", () => ({
  exportConsumerNarrativePdf: exportConsumerNarrativePdfMock
}));

import { GET } from "./route";

describe("consumer narrative pdf route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a PDF response for consumer users", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "consumer" }
    });
    exportConsumerNarrativePdfMock.mockResolvedValue({
      fileName: "consumer-narrative-case-1.pdf",
      mimeType: "application/pdf",
      buffer: new Uint8Array([37, 80, 68, 70])
    });

    const request = new Request("http://localhost/api/cases/case-1/reports/consumer/narrative/pdf") as NextRequest;
    const response = await GET(request, {
      params: Promise.resolve({ caseId: "case-1" })
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("consumer-narrative-case-1.pdf");
    expect(exportConsumerNarrativePdfMock).toHaveBeenCalledWith("case-1", "user-1", "consumer");
  });

  it("returns 403 when a non-consumer requests the PDF", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-2", role: "investigator" }
    });

    const request = new Request("http://localhost/api/cases/case-1/reports/consumer/narrative/pdf") as NextRequest;
    const response = await GET(request, {
      params: Promise.resolve({ caseId: "case-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
  });
});
