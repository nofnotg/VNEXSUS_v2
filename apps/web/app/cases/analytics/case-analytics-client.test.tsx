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
  getAnalyticsPresetsMock,
  getSharedAnalyticsPresetsMock,
  createAnalyticsPresetMock,
  deleteAnalyticsPresetMock,
  shareAnalyticsPresetMock,
  downloadAnalyticsExportMock,
  searchAnalyticsShareCandidatesMock
} = vi.hoisted(() => ({
  getCaseAnalyticsMock: vi.fn(),
  getCaseAnalyticsTrendMock: vi.fn(),
  getAnalyticsPresetsMock: vi.fn(),
  getSharedAnalyticsPresetsMock: vi.fn(),
  createAnalyticsPresetMock: vi.fn(),
  deleteAnalyticsPresetMock: vi.fn(),
  shareAnalyticsPresetMock: vi.fn(),
  downloadAnalyticsExportMock: vi.fn(),
  searchAnalyticsShareCandidatesMock: vi.fn()
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
  getAnalyticsPresets: getAnalyticsPresetsMock,
  getSharedAnalyticsPresets: getSharedAnalyticsPresetsMock,
  createAnalyticsPreset: createAnalyticsPresetMock,
  deleteAnalyticsPreset: deleteAnalyticsPresetMock,
  shareAnalyticsPreset: shareAnalyticsPresetMock,
  downloadAnalyticsExport: downloadAnalyticsExportMock,
  searchAnalyticsShareCandidates: searchAnalyticsShareCandidatesMock
}));

describe("case analytics client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    getAnalyticsPresetsMock.mockResolvedValue([
      {
        presetId: "owned-1",
        userId: "user-1",
        name: "My preset",
        filter: {},
        interval: "daily",
        isShared: true,
        sharedWith: ["reviewer@example.com"],
        createdAt: "2026-03-10T00:00:00.000Z"
      }
    ]);
    getSharedAnalyticsPresetsMock.mockResolvedValue([
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
    ]);
    searchAnalyticsShareCandidatesMock.mockResolvedValue({
      items: [
        {
          userId: "user-3",
          email: "reviewer@example.com",
          displayName: "Reviewer"
        }
      ],
      page: 1,
      hasMore: true
    });
    downloadAnalyticsExportMock.mockImplementation(async ({ onProgress }) => {
      onProgress?.({ percent: 55, receivedBytes: 550, totalBytes: 1000 });
      return {
        filename: "analytics-weekly-20260311.csv",
        blob: new Blob(["section,key,value"], { type: "text/csv" })
      };
    });

    const view = render(
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
      expect(downloadAnalyticsExportMock).toHaveBeenCalledTimes(1);
      expect(downloadAnalyticsExportMock).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: "csv",
          filter: {
            startDate: "2026-02-09",
            endDate: "2026-03-10",
            eventTypes: undefined,
            hospitals: undefined
          },
          interval: "daily",
          onProgress: expect.any(Function)
        })
      );
    });
    await waitFor(() => {
      expect(screen.getByText("Analytics export is ready.")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    fireEvent.change(screen.getByPlaceholderText("Search teammates by name or email"), {
      target: { value: "review" }
    });

    await waitFor(() => {
      expect(searchAnalyticsShareCandidatesMock).toHaveBeenCalledWith("review", 1);
    });
    expect(screen.getByRole("button", { name: "Load more teammates" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reviewer (reviewer@example.com)" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Share" })[1]!);

    await waitFor(() => {
      expect(shareAnalyticsPresetMock).toHaveBeenCalledWith({
        presetId: "owned-1",
        sharedWith: ["reviewer@example.com"]
      });
    });
    await waitFor(() => {
      expect(screen.getAllByText(/reviewer@example\.com/).length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(screen.getByText("Preset sharing updated.")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Refresh presets" }));
    await waitFor(() => {
      expect(getAnalyticsPresetsMock).toHaveBeenCalledTimes(1);
      expect(getSharedAnalyticsPresetsMock).toHaveBeenCalledTimes(1);
    });

    expect(appendChildSpy).toHaveBeenCalled();
    view.unmount();
  }, 15000);
});
