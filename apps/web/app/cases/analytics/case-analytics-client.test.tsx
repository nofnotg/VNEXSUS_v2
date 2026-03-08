// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../components/locale-provider";
import { ThemeProvider } from "../../../components/theme-provider";
import { CaseAnalyticsClient } from "./case-analytics-client";

const { getCaseAnalyticsMock, getCaseAnalyticsTrendMock } = vi.hoisted(() => ({
  getCaseAnalyticsMock: vi.fn(),
  getCaseAnalyticsTrendMock: vi.fn()
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

vi.mock("../../../lib/client/case-analytics-api", () => ({
  CaseAnalyticsApiError: class CaseAnalyticsApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "CaseAnalyticsApiError";
    }
  },
  getCaseAnalytics: getCaseAnalyticsMock,
  getCaseAnalyticsTrend: getCaseAnalyticsTrendMock
}));

describe("case analytics client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies filters and refreshes trend data", async () => {
    getCaseAnalyticsMock.mockResolvedValue({
      totalCases: 1,
      totalEvents: 2,
      confirmedEvents: 1,
      unconfirmedEvents: 1,
      reviewRequiredEvents: 0,
      eventsByType: { exam: 2 },
      eventsByHospital: { "Seoul Hospital": 2 }
    });
    getCaseAnalyticsTrendMock.mockResolvedValue({
      interval: "weekly",
      points: [{ date: "2026-01-05", total: 2, confirmed: 1, unconfirmed: 1 }]
    });

    render(
      <ThemeProvider initialTheme="light">
        <LocaleProvider initialLocale="en">
          <CaseAnalyticsClient
            initialAnalytics={{
              totalCases: 3,
              totalEvents: 8,
              confirmedEvents: 5,
              unconfirmedEvents: 3,
              reviewRequiredEvents: 2,
              eventsByType: { exam: 4, surgery: 1 },
              eventsByHospital: { "Seoul Hospital": 5, "Busan Hospital": 2 }
            }}
            initialTrend={{
              interval: "daily",
              points: [{ date: "2026-01-01", total: 2, confirmed: 1, unconfirmed: 1 }]
            }}
          />
        </LocaleProvider>
      </ThemeProvider>
    );

    expect(screen.getByTestId("line-chart")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2026-01-01" }
    });
    fireEvent.change(screen.getByLabelText("End date"), {
      target: { value: "2026-01-31" }
    });
    fireEvent.change(screen.getByLabelText("Interval"), {
      target: { value: "weekly" }
    });
    const eventTypesSelect = screen.getByLabelText("Event types") as HTMLSelectElement;
    const hospitalsSelect = screen.getByLabelText("Hospitals") as HTMLSelectElement;

    for (const option of Array.from(eventTypesSelect.options)) {
      option.selected = option.value === "exam";
    }
    for (const option of Array.from(hospitalsSelect.options)) {
      option.selected = option.value === "Seoul Hospital";
    }

    Object.defineProperty(eventTypesSelect, "selectedOptions", {
      configurable: true,
      value: [{ value: "exam" }]
    });
    Object.defineProperty(hospitalsSelect, "selectedOptions", {
      configurable: true,
      value: [{ value: "Seoul Hospital" }]
    });

    fireEvent.change(eventTypesSelect);
    fireEvent.change(hospitalsSelect);

    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    await waitFor(() => {
      expect(getCaseAnalyticsMock).toHaveBeenCalledWith({
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        eventTypes: ["exam"],
        hospitals: ["Seoul Hospital"]
      });
    });

    expect(getCaseAnalyticsTrendMock).toHaveBeenCalledWith(
      {
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        eventTypes: ["exam"],
        hospitals: ["Seoul Hospital"]
      },
      "weekly"
    );
  });
});
