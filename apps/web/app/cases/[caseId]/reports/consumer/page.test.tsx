// @vitest-environment jsdom

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConsumerReportPage from "./page.js";

const { getSessionUserMock } = vi.hoisted(() => ({
  getSessionUserMock: vi.fn()
}));

vi.mock("../../../../../lib/session", () => ({
  getSessionUser: getSessionUserMock
}));

vi.mock("../../../../../lib/server/report-locale", () => ({
  getRequestLocale: vi.fn().mockResolvedValue("en")
}));

describe("consumer report page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders consumer report data for consumer users", async () => {
    getSessionUserMock.mockResolvedValue({
      id: "user-1",
      email: "consumer@example.com",
      role: "consumer",
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
              email: "consumer@example.com",
              role: "consumer",
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
            requiresReview: true,
            sections: [
              {
                sectionTitle: "timeline_summary",
                summaryItems: [
                  {
                    title: "2024-03-07 | Seoul Hospital",
                    value: "Pneumonia / CT"
                  }
                ],
                riskSignals: [],
                checkPoints: [],
                nextActions: [],
                requiresReview: false
              },
              {
                sectionTitle: "consumer_overview",
                summaryItems: [{ title: "hospitalSummary", value: "Seoul Hospital" }],
                riskSignals: ["review_required_bundle"],
                checkPoints: ["review_required_bundle_exists"],
                nextActions: ["review_original_documents"],
                requiresReview: true
              }
            ]
          },
          meta: { requestId: "req-report" }
        })
      );

    vi.stubGlobal("fetch", fetchMock);

    const ui = await ConsumerReportPage({
      params: Promise.resolve({ caseId: "case-1" })
    });

    render(ui);

    expect(screen.getByText("Loading consumer report...")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("timeline_summary")).toBeTruthy();
    });

    expect(screen.getByText("2024-03-07 | Seoul Hospital")).toBeTruthy();
    expect(screen.getByText("review_required_bundle_exists")).toBeTruthy();
    expect(screen.getByText("review_original_documents")).toBeTruthy();
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/auth/me",
      expect.objectContaining({ method: "GET", credentials: "same-origin", cache: "no-store" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/cases/case-1/reports/consumer",
      expect.objectContaining({ method: "GET", credentials: "same-origin", cache: "no-store" })
    );
  });

  it("blocks rendering for non-consumer users before client fetch", async () => {
    getSessionUserMock.mockResolvedValue({
      id: "user-2",
      email: "investigator@example.com",
      role: "investigator",
      status: "active"
    });

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const ui = await ConsumerReportPage({
      params: Promise.resolve({ caseId: "case-1" })
    });

    render(ui);

    expect(screen.getByText("403 | Consumer Report")).toBeTruthy();
    expect(screen.getByText("Your current role cannot open consumer report JSON.")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
