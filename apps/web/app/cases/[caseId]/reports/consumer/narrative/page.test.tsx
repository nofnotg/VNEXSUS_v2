// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../../../../components/locale-provider";
import ConsumerNarrativePage from "./page.js";

const { getSessionUserMock, getRequestLocaleMock } = vi.hoisted(() => ({
  getSessionUserMock: vi.fn(),
  getRequestLocaleMock: vi.fn()
}));

vi.mock("../../../../../../lib/session", () => ({
  getSessionUser: getSessionUserMock
}));

vi.mock("../../../../../../lib/server/report-locale", () => ({
  getRequestLocale: getRequestLocaleMock
}));

describe("consumer narrative page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    document.cookie = "vnexus_lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  });

  it("updates localized UI and API lang when the locale changes", async () => {
    getSessionUserMock.mockResolvedValue({
      id: "user-1",
      email: "consumer@example.com",
      role: "consumer",
      status: "active"
    });
    getRequestLocaleMock.mockResolvedValue("en");

    const fetchMock = vi.fn((input: string) => {
      if (input === "/api/auth/me") {
        return Promise.resolve(
          Response.json({
            success: true,
            data: { user: { id: "user-1", role: "consumer" } }
          })
        );
      }

      if (input === "/api/cases/case-1/reports/consumer/narrative?lang=en") {
        return Promise.resolve(
          Response.json({
            success: true,
            data: {
              caseId: "case-1",
              generatedAt: "2026-03-08T00:00:00.000Z",
              requiresReview: false,
              sections: [{ heading: "timeline_summary", paragraphs: ["On 2024-03-07, a visit record was identified."], requiresReview: false }]
            },
            meta: { requestId: "req-en" }
          })
        );
      }

      if (input === "/api/cases/case-1/reports/consumer/narrative?lang=ko") {
        return Promise.resolve(
          Response.json({
            success: true,
            data: {
              caseId: "case-1",
              generatedAt: "2026-03-08T00:00:00.000Z",
              requiresReview: false,
              sections: [{ heading: "timeline_summary", paragraphs: ["2024-03-07에 방문 기록이 확인되었다."], requiresReview: false }]
            },
            meta: { requestId: "req-ko" }
          })
        );
      }

      return Promise.reject(new Error(`Unexpected fetch: ${input}`));
    });

    vi.stubGlobal("fetch", fetchMock);

    const ui = await ConsumerNarrativePage({
      params: Promise.resolve({ caseId: "case-1" })
    });

    render(<LocaleProvider initialLocale="en">{ui}</LocaleProvider>);

    await waitFor(() => {
      expect(screen.getByText("Download PDF")).toBeTruthy();
    });

    fireEvent.change(screen.getByRole("combobox", { name: "Select language" }), {
      target: { value: "ko" }
    });

    await waitFor(() => {
      expect(screen.getByText("PDF 다운로드")).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getByText("2024-03-07에 방문 기록이 확인되었다.")).toBeTruthy();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/cases/case-1/reports/consumer/narrative?lang=ko",
      expect.objectContaining({ method: "GET", credentials: "same-origin", cache: "no-store" })
    );
  });
});
