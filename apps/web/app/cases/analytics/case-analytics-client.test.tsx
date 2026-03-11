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
  deleteAnalyticsPresetMock,
  shareAnalyticsPresetMock,
  downloadAnalyticsExportMock
} = vi.hoisted(() => ({
  getCaseAnalyticsMock: vi.fn(),
  getCaseAnalyticsTrendMock: vi.fn(),
  createAnalyticsPresetMock: vi.fn(),
  deleteAnalyticsPresetMock: vi.fn(),
  shareAnalyticsPresetMock: vi.fn(),
  downloadAnalyticsExportMock: vi.fn()
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
  deleteAnalyticsPreset: deleteAnalyticsPresetMock,
  shareAnalyticsPreset: shareAnalyticsPresetMock,
  downloadAnalyticsExport: downloadAnalyticsExportMock
}));

describe("case analytics client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("prompt", vi.fn(() => "reviewer@example.com"));
    Object.defineProperty(globalThis.URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(() => "blob:analytics")
    });
    Object.defineProperty(globalThis.URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn()
    });
  });

  it("exports analytics, shares presets, and renders shared preset sections", async () => {
    const clickMock = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    vi.spyOn(document, "createElement").mockImplementation(((tagName: string) => {
      if (tagName === "a") {
        const anchor = originalCreateElement("a");
        anchor.click = clickMock;
        return anchor;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

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
      isShared: false,
      sharedWith: [],
      createdAt: "2026-03-10T00:00:00.000Z"
    });
    shareAnalyticsPresetMock.mockResolvedValue(undefined);
    downloadAnalyticsExportMock.mockResolvedValue({
      filename: "analytics-weekly-20260311.csv",
      blob: new Blob(["section,key,value"], { type: "text/csv" })
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
            initialOwnedPresets={[
              {
                presetId: "owned-1",
                userId: "user-1",
                name: "My preset",
                filter: {},
                interval: "daily",
                isShared: false,
                sharedWith: [],
                createdAt: "2026-03-10T00:00:00.000Z"
              }
            ]}
            initialSharedPresets={[
              {
                presetId: "shared-1",
                userId: "user-2",
                name: "Shared preset",
                filter: { hospitals: ["Seoul Hospital"] },
                interval: "weekly",
                isShared: true,
                sharedWith: ["user-1@example.com"],
                createdAt: "2026-03-10T00:00:00.000Z"
              }
            ]}
          />
        </LocaleProvider>
      </ThemeProvider>
    );

    expect(screen.getByRole("heading", { level: 3, name: "My presets" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "Shared presets" })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Export"), {
      target: { value: "csv" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Export" }));

    await waitFor(() => {
      expect(downloadAnalyticsExportMock).toHaveBeenCalledWith({
        fileType: "csv",
        filter: {
          startDate: "2026-02-09",
          endDate: "2026-03-10"
        },
        interval: "daily"
      });
    });
    await waitFor(() => {
      expect(screen.getByText("Analytics export is ready.")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    await waitFor(() => {
      expect(shareAnalyticsPresetMock).toHaveBeenCalledWith({
        presetId: "owned-1",
        sharedWith: ["reviewer@example.com"]
      });
    });
    await waitFor(() => {
      expect(screen.getAllByText(/reviewer@example\.com/).length).toBeGreaterThan(0);
    });

    expect(appendChildSpy).toHaveBeenCalled();
  });
});
