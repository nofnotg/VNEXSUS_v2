// @vitest-environment jsdom

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InvestigatorReportPage from "./page.js";

const { getSessionUserMock } = vi.hoisted(() => ({
  getSessionUserMock: vi.fn()
}));

vi.mock("../../../../../lib/session", () => ({
  getSessionUser: getSessionUserMock
}));

describe("investigator report page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders investigator report data for investigator users", async () => {
    getSessionUserMock.mockResolvedValue({
      id: "user-1",
      email: "investigator@example.com",
      role: "investigator",
      status: "active"
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          success: true,
          data: {
            user: {
              id: "user-1",
              email: "investigator@example.com",
              role: "investigator",
              status: "active"
            }
          },
          meta: { requestId: "req-auth" }
        })
      )
      .mockResolvedValueOnce(
        Response.json({
          success: true,
          data: {
            caseId: "case-1",
            generatedAt: "2026-03-08T00:00:00.000Z",
            requiresReview: false,
            sections: [
              {
                sectionTitle: "2024-03-07 | exam",
                entries: [
                  { label: "hospital", value: "Seoul Hospital" },
                  { label: "diagnosis", value: "Pneumonia" }
                ],
                requiresReview: false,
                notes: []
              }
            ]
          },
          meta: { requestId: "req-report" }
        })
      );

    vi.stubGlobal("fetch", fetchMock);

    const ui = await InvestigatorReportPage({
      params: Promise.resolve({ caseId: "case-1" })
    });

    render(ui);

    expect(screen.getByText("Loading investigator report...")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("2024-03-07 | exam")).toBeTruthy();
    });

    expect(screen.getByText("Seoul Hospital")).toBeTruthy();
    expect(screen.getByText("Pneumonia")).toBeTruthy();
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/auth/me",
      expect.objectContaining({ method: "GET", credentials: "same-origin", cache: "no-store" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/cases/case-1/reports/investigator",
      expect.objectContaining({ method: "GET", credentials: "same-origin", cache: "no-store" })
    );
  });

  it("blocks rendering for non-investigator users before client fetch", async () => {
    getSessionUserMock.mockResolvedValue({
      id: "user-2",
      email: "consumer@example.com",
      role: "consumer",
      status: "active"
    });

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const ui = await InvestigatorReportPage({
      params: Promise.resolve({ caseId: "case-1" })
    });

    render(ui);

    expect(screen.getByText("403 | Investigator Report")).toBeTruthy();
    expect(screen.getByText("Your current role cannot open investigator report JSON.")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
