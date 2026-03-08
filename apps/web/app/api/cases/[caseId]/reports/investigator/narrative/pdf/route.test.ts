import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { ApiError } from "@vnexus/shared";

const { requireAuthorizedSessionMock, apiFailureMock, exportInvestigatorNarrativePdfMock } = vi.hoisted(() => ({
  requireAuthorizedSessionMock: vi.fn(),
  apiFailureMock: vi.fn((error: unknown) => {
    if (error instanceof ApiError) {
      const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400;
      return Response.json({ success: false, code: error.code, message: error.message }, { status });
    }

    return Response.json({ success: false, code: "INTERNAL_ERROR" }, { status: 500 });
  }),
  exportInvestigatorNarrativePdfMock: vi.fn()
}));

vi.mock("../../../../../../../../lib/server/api", () => ({
  requireAuthorizedSession: requireAuthorizedSessionMock,
  apiFailure: apiFailureMock
}));

vi.mock("../../../../../../../../lib/server/services/investigator-report-export-service", () => ({
  exportInvestigatorNarrativePdf: exportInvestigatorNarrativePdfMock
}));

import { GET } from "./route";

describe("investigator narrative pdf route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a PDF response for investigator users", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-1", role: "investigator" }
    });
    exportInvestigatorNarrativePdfMock.mockResolvedValue({
      fileName: "investigator-narrative-case-1.pdf",
      mimeType: "application/pdf",
      buffer: new Uint8Array([37, 80, 68, 70])
    });

    const request = new Request("http://localhost/api/cases/case-1/reports/investigator/narrative/pdf") as NextRequest;
    const response = await GET(request, {
      params: Promise.resolve({ caseId: "case-1" })
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("investigator-narrative-case-1.pdf");
    expect(exportInvestigatorNarrativePdfMock).toHaveBeenCalledWith("case-1", "user-1", "investigator");
  });

  it("returns 403 when a non-investigator requests the PDF", async () => {
    requireAuthorizedSessionMock.mockResolvedValue({
      user: { id: "user-2", role: "consumer" }
    });

    const request = new Request("http://localhost/api/cases/case-1/reports/investigator/narrative/pdf") as NextRequest;
    const response = await GET(request, {
      params: Promise.resolve({ caseId: "case-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
  });
});
