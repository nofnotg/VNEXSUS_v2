// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../components/locale-provider";
import { ThemeProvider } from "../../../components/theme-provider";
import CaseDetailPage from "./page.js";

const { getSessionUserMock, getRequestLocaleMock, getCaseDetailMock } = vi.hoisted(() => ({
  getSessionUserMock: vi.fn(),
  getRequestLocaleMock: vi.fn(),
  getCaseDetailMock: vi.fn()
}));

vi.mock("../../../lib/session", () => ({
  getSessionUser: getSessionUserMock
}));

vi.mock("../../../lib/server/report-locale", () => ({
  getRequestLocale: getRequestLocaleMock
}));

vi.mock("../../../lib/server/services/case-detail-service", () => ({
  getCaseDetail: getCaseDetailMock
}));

describe("case detail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    document.cookie = "vnexus_lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "vnexus_theme=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  });

  it("renders timeline data, updates locale labels, and calls confirmation API", async () => {
    getSessionUserMock.mockResolvedValue({
      id: "user-1",
      email: "investigator@example.com",
      role: "investigator",
      status: "active"
    });
    getRequestLocaleMock.mockResolvedValue("en");
    getCaseDetailMock.mockResolvedValue({
      caseId: "case-1",
      hospitalName: "Seoul Hospital",
      events: [
        {
          eventId: "event-1",
          type: "exam",
          date: "2026-03-05",
          hospital: "Seoul Hospital",
          details: "Chest CT | Pneumonia",
          confirmed: false,
          requiresReview: true,
          metadata: {
            fileOrder: 1,
            pageOrder: 1,
            anchorBlockIndex: 0,
            eventBundleId: "bundle-1",
            sourceFileId: "doc-1",
            sourcePageId: "page-1"
          }
        }
      ]
    });

    const fetchMock = vi.fn((input: string) => {
      if (input === "/api/user/preferences") {
        return Promise.resolve(
          Response.json({
            success: true,
            data: { locale: "ko", theme: "light" },
            meta: { requestId: "req-prefs" }
          })
        );
      }

      if (input === "/api/cases/case-1/events/event-1/confirmation") {
        return Promise.resolve(
          Response.json({
            success: true,
            data: { caseId: "case-1", eventId: "event-1", confirmed: true },
            meta: { requestId: "req-confirm" }
          })
        );
      }

      return Promise.reject(new Error(`Unexpected fetch: ${input}`));
    });
    vi.stubGlobal("fetch", fetchMock);

    const ui = await CaseDetailPage({
      params: Promise.resolve({ caseId: "case-1" })
    });

    render(
      <ThemeProvider initialTheme="light">
        <LocaleProvider initialLocale="en">{ui}</LocaleProvider>
      </ThemeProvider>
    );

    expect(screen.getByText("Event timeline")).toBeTruthy();
    expect(screen.getByText("Chest CT | Pneumonia")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeTruthy();

    fireEvent.change(screen.getByRole("combobox", { name: "Select language" }), {
      target: { value: "ko" }
    });

    await waitFor(() => {
      expect(screen.getByText("이벤트 타임라인")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "확정" }));

    await waitFor(() => {
      expect(screen.getByText("확정 상태를 저장했습니다.")).toBeTruthy();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/cases/case-1/events/event-1/confirmation",
      expect.objectContaining({
        method: "PUT",
        credentials: "same-origin"
      })
    );
  });

  it("renders read-only detail for consumer users", async () => {
    getSessionUserMock.mockResolvedValue({
      id: "user-2",
      email: "consumer@example.com",
      role: "consumer",
      status: "active"
    });
    getRequestLocaleMock.mockResolvedValue("en");
    getCaseDetailMock.mockResolvedValue({
      caseId: "case-2",
      hospitalName: "Busan Hospital",
      events: [
        {
          eventId: "event-2",
          type: "visit",
          date: "2026-03-06",
          hospital: "Busan Hospital",
          details: "Outpatient record",
          confirmed: true,
          requiresReview: false
        }
      ]
    });

    const ui = await CaseDetailPage({
      params: Promise.resolve({ caseId: "case-2" })
    });

    render(
      <ThemeProvider initialTheme="light">
        <LocaleProvider initialLocale="en">{ui}</LocaleProvider>
      </ThemeProvider>
    );

    expect(screen.getByText("Confirmed")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Mark unconfirmed" })).toBeNull();
  });
});
