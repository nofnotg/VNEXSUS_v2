// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLocaleMessages } from "@vnexus/shared";
import { LocaleProvider } from "../../../components/locale-provider";
import { ThemeProvider } from "../../../components/theme-provider";
import CaseAnalyticsPage from "./page.js";

const {
  getSessionUserMock,
  getRequestLocaleMock,
  getCaseAnalyticsMock,
  getCaseAnalyticsTrendMock,
  getPresetsForUserMock,
  getDefaultAnalyticsFilterMock
} = vi.hoisted(() => ({
  getSessionUserMock: vi.fn(),
  getRequestLocaleMock: vi.fn(),
  getCaseAnalyticsMock: vi.fn(),
  getCaseAnalyticsTrendMock: vi.fn(),
  getPresetsForUserMock: vi.fn(),
  getDefaultAnalyticsFilterMock: vi.fn()
}));

vi.mock("recharts", () => ({
  CartesianGrid: () => null,
  Legend: () => null,
  Line: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null
}));

vi.mock("../../../lib/session", () => ({
  getSessionUser: getSessionUserMock
}));

vi.mock("../../../lib/server/report-locale", () => ({
  getRequestLocale: getRequestLocaleMock
}));

vi.mock("../../../lib/server/case-analytics-query", () => ({
  getDefaultAnalyticsFilter: getDefaultAnalyticsFilterMock
}));

vi.mock("../../../lib/server/services/case-analytics-service", () => ({
  getCaseAnalytics: getCaseAnalyticsMock,
  getCaseAnalyticsTrend: getCaseAnalyticsTrendMock
}));

vi.mock("../../../lib/server/services/analytics-preset-service", () => ({
  getPresetsForUser: getPresetsForUserMock
}));

describe("case analytics page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    document.cookie = "vnexus_lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "vnexus_theme=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    getDefaultAnalyticsFilterMock.mockReturnValue({
      startDate: "2026-02-09",
      endDate: "2026-03-10"
    });
  });

  it("renders analytics page, localizes UI labels, and uses the default 30-day filter", async () => {
    const ko = getLocaleMessages("ko");

    getSessionUserMock.mockResolvedValue({
      id: "user-1",
      email: "investigator@example.com",
      role: "investigator",
      status: "active"
    });
    getRequestLocaleMock.mockResolvedValue("en");
    getCaseAnalyticsMock.mockResolvedValue({
      totalCases: 3,
      totalEvents: 8,
      confirmedEvents: 5,
      unconfirmedEvents: 3,
      reviewRequiredEvents: 2,
      eventsByType: {
        exam: 4,
        outpatient: 3
      },
      eventsByHospital: {
        "Seoul Hospital": 5,
        "Busan Hospital": 2
      },
      topHospitals: [{ hospital: "Seoul Hospital", events: 5 }]
    });
    getCaseAnalyticsTrendMock.mockResolvedValue({
      interval: "daily",
      points: [{ date: "2026-03-10", total: 2, confirmed: 1, unconfirmed: 1 }]
    });
    getPresetsForUserMock.mockResolvedValue([]);

    vi.stubGlobal(
      "fetch",
      vi.fn((input: string) => {
        if (input === "/api/user/preferences") {
          return Promise.resolve(
            Response.json({
              success: true,
              data: { locale: "ko", theme: "light" },
              meta: { requestId: "req-prefs" }
            })
          );
        }

        return Promise.reject(new Error(`Unexpected fetch: ${input}`));
      })
    );

    const ui = await CaseAnalyticsPage();

    expect(getCaseAnalyticsMock).toHaveBeenCalledWith("user-1", "investigator", {
      startDate: "2026-02-09",
      endDate: "2026-03-10"
    });

    render(
      <ThemeProvider initialTheme="light">
        <LocaleProvider initialLocale="en">{ui}</LocaleProvider>
      </ThemeProvider>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Case Analytics" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Saved presets" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Top hospitals" })).toBeTruthy();

    fireEvent.change(screen.getByRole("combobox", { name: "Select language" }), {
      target: { value: "ko" }
    });

    await waitFor(() => {
      expect(screen.getByText(ko.uiAnalyticsHeading)).toBeTruthy();
    });

    expect(screen.getByRole("heading", { level: 2, name: ko.uiAnalyticsPresets })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: ko.uiTopHospitals })).toBeTruthy();
  });

  it("blocks analytics for consumer users", async () => {
    getSessionUserMock.mockResolvedValue({
      id: "user-2",
      email: "consumer@example.com",
      role: "consumer",
      status: "active"
    });
    getRequestLocaleMock.mockResolvedValue("en");

    const ui = await CaseAnalyticsPage();
    render(ui);

    expect(screen.getByText("403 | Case Analytics")).toBeTruthy();
    expect(screen.getByText("Your current role cannot open investigator report JSON.")).toBeTruthy();
  });
});
