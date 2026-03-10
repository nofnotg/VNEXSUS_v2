// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../components/locale-provider";
import { ThemeProvider } from "../../../components/theme-provider";
import { CaseAnalyticsClient } from "./case-analytics-client";

const {
  getCaseAnalyticsMock,
  getCaseAnalyticsTrendMock,
  createAnalyticsPresetMock,
  deleteAnalyticsPresetMock
} = vi.hoisted(() => ({
  getCaseAnalyticsMock: vi.fn(),
  getCaseAnalyticsTrendMock: vi.fn(),
  createAnalyticsPresetMock: vi.fn(),
  deleteAnalyticsPresetMock: vi.fn()
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
  getCaseAnalyticsTrend: getCaseAnalyticsTrendMock,
  createAnalyticsPreset: createAnalyticsPresetMock,
  deleteAnalyticsPreset: deleteAnalyticsPresetMock
}));

describe("case analytics client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies filters, saves presets, and supports hospital drill-down", async () => {
    getCaseAnalyticsMock.mockResolvedValue({
      totalCases: 1,
      totalEvents: 2,
      confirmedEvents: 1,
      unconfirmedEvents: 1,
      reviewRequiredEvents: 0,
      eventsByType: { exam: 2 },
      eventsByHospital: { "Seoul Hospital": 2 },
      topHospitals: [{ hospital: "Seoul Hospital", events: 2 }]
    });
    getCaseAnalyticsTrendMock.mockResolvedValue({
      interval: "weekly",
      points: [{ date: "2026-03-03", total: 2, confirmed: 1, unconfirmed: 1 }]
    });
    createAnalyticsPresetMock.mockResolvedValue({
      presetId: "preset-1",
      userId: "user-1",
      name: "Recent exams",
      filter: { eventTypes: ["exam"] },
      interval: "weekly",
      createdAt: "2026-03-10T00:00:00.000Z"
    });
    deleteAnalyticsPresetMock.mockResolvedValue(undefined);

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
              eventsByHospital: { "Seoul Hospital": 5, "Busan Hospital": 2 },
              topHospitals: [{ hospital: "Seoul Hospital", events: 5 }]
            }}
            initialTrend={{
              interval: "daily",
              points: [{ date: "2026-03-10", total: 2, confirmed: 1, unconfirmed: 1 }]
            }}
            initialFilter={{
              startDate: "2026-02-09",
              endDate: "2026-03-10"
            }}
            initialPresets={[]}
          />
        </LocaleProvider>
      </ThemeProvider>
    );

    expect(screen.getByTestId("line-chart")).toBeTruthy();
    expect((screen.getByLabelText("Start date") as HTMLInputElement).value).toBe("2026-02-09");

    fireEvent.change(screen.getByLabelText("Interval"), {
      target: { value: "weekly" }
    });
    fireEvent.change(screen.getByLabelText("Preset name"), {
      target: { value: "Recent exams" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Save preset" }));

    await waitFor(() => {
      expect(createAnalyticsPresetMock).toHaveBeenCalledWith({
        name: "Recent exams",
        filter: {
          startDate: "2026-02-09",
          endDate: "2026-03-10"
        },
        interval: "weekly"
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "View details" }));

    await waitFor(() => {
      expect(getCaseAnalyticsMock).toHaveBeenCalledWith({
        startDate: "2026-02-09",
        endDate: "2026-03-10",
        hospitals: ["Seoul Hospital"]
      });
    });
  });
});
