// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../../../../packages/shared/src/locale/messages";
import { LocaleProvider } from "../../../components/locale-provider";
import { ThemeProvider } from "../../../components/theme-provider";
import CaseAnalyticsPage from "./page.js";

const { getSessionUserMock, getRequestLocaleMock, getCaseAnalyticsMock } = vi.hoisted(() => ({
  getSessionUserMock: vi.fn(),
  getRequestLocaleMock: vi.fn(),
  getCaseAnalyticsMock: vi.fn()
}));

vi.mock("../../../lib/session", () => ({
  getSessionUser: getSessionUserMock
}));

vi.mock("../../../lib/server/report-locale", () => ({
  getRequestLocale: getRequestLocaleMock
}));

vi.mock("../../../lib/server/services/case-analytics-service", () => ({
  getCaseAnalytics: getCaseAnalyticsMock
}));

describe("case analytics page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    document.cookie = "vnexus_lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "vnexus_theme=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  });

  it("renders analytics cards and localizes labels", async () => {
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
        outpatient: 3,
        surgery: 1
      },
      eventsByHospital: {
        "Seoul Hospital": 5,
        "Busan Hospital": 2
      }
    });

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

    render(
      <ThemeProvider initialTheme="light">
        <LocaleProvider initialLocale="en">{ui}</LocaleProvider>
      </ThemeProvider>
    );

    expect(screen.getByRole("heading", { level: 1, name: messages.en.uiAnalyticsHeading })).toBeTruthy();
    expect(screen.getByText(messages.en.uiTotalCases)).toBeTruthy();
    expect(screen.getByText(messages.en.uiEventsByType)).toBeTruthy();
    expect(screen.getByText("Seoul Hospital")).toBeTruthy();

    fireEvent.change(screen.getByRole("combobox", { name: messages.en.uiLocaleSelectLabel }), {
      target: { value: "ko" }
    });

    await waitFor(() => {
      expect(screen.getByText(messages.ko.uiAnalyticsHeading)).toBeTruthy();
    });

    expect(screen.getByText(messages.ko.uiTotalCases)).toBeTruthy();
    expect(screen.getByText(messages.ko.uiEventsByType)).toBeTruthy();
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
