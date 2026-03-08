// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../components/locale-provider";
import { ThemeProvider } from "../../components/theme-provider";
import CasesPage from "./page.js";

const { getSessionUserMock, getRequestLocaleMock } = vi.hoisted(() => ({
  getSessionUserMock: vi.fn(),
  getRequestLocaleMock: vi.fn()
}));

vi.mock("../../lib/session", () => ({
  getSessionUser: getSessionUserMock
}));

vi.mock("../../lib/server/report-locale", () => ({
  getRequestLocale: getRequestLocaleMock
}));

describe("cases page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    document.cookie = "vnexus_lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "vnexus_theme=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  });

  it("renders case list and updates localized headers when locale changes", async () => {
    getSessionUserMock.mockResolvedValue({
      id: "user-1",
      email: "consumer@example.com",
      role: "consumer",
      status: "active"
    });
    getRequestLocaleMock.mockResolvedValue("en");

    vi.stubGlobal(
      "fetch",
      vi.fn((input: string) => {
        if (input === "/api/cases/list") {
          return Promise.resolve(
            Response.json({
              success: true,
              data: {
                items: [
                  {
                    caseId: "case-1",
                    hospitalName: "Seoul Hospital",
                    uploadDate: "2026-03-06T09:00:00.000Z",
                    status: "ready",
                    audience: "consumer",
                    hasReport: true,
                    hasNarrative: true,
                    hasPdf: true
                  }
                ]
              },
              meta: { requestId: "req-case-list" }
            })
          );
        }

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

    const ui = await CasesPage();

    render(
      <ThemeProvider initialTheme="light">
        <LocaleProvider initialLocale="en">{ui}</LocaleProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Case ID")).toBeTruthy();
    });

    expect(screen.getByText("case-1")).toBeTruthy();
    expect(screen.getByText("Seoul Hospital")).toBeTruthy();
    expect(screen.getByText("Ready")).toBeTruthy();

    fireEvent.change(screen.getByRole("combobox", { name: "Select language" }), {
      target: { value: "ko" }
    });

    await waitFor(() => {
      expect(screen.getByText("사례 ID")).toBeTruthy();
    });

    expect(screen.getByText("병원")).toBeTruthy();
    expect(screen.getByText("작업")).toBeTruthy();
  });
});
