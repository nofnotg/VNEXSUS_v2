// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getLocaleMessages } from "@vnexus/shared";
import { LocaleProvider, useLocale, useLocaleMessages } from "./locale-provider";

function LocaleProbe() {
  const { locale, setLocale } = useLocale();
  const localeMessages = useLocaleMessages();

  return (
    <div>
      <span>{locale}</span>
      <span>{localeMessages.uiDownloadPdf}</span>
      <button type="button" onClick={() => setLocale("ko")}>
        switch
      </button>
    </div>
  );
}

describe("LocaleProvider", () => {
  it("updates locale state and persists it to cookie and localStorage", async () => {
    window.localStorage.clear();
    document.cookie = "vnexus_lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    render(
      <LocaleProvider initialLocale="en">
        <LocaleProbe />
      </LocaleProvider>
    );

    expect(screen.getByText("en")).toBeTruthy();
    expect(screen.getByText("Download PDF")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "switch" }));

    await waitFor(() => {
      expect(screen.getByText("ko")).toBeTruthy();
    });

    expect(screen.getByText("PDF 다운로드")).toBeTruthy();
    expect(window.localStorage.getItem("vnexus_lang")).toBe("ko");
    expect(document.cookie).toContain("vnexus_lang=ko");
  });

  it("falls back to English when a locale key is missing", () => {
    const localeMessages = getLocaleMessages("ko", {
      en: { uiDashboard: "Dashboard" },
      ko: { uiHome: "홈" }
    });

    expect(localeMessages.uiHome).toBe("홈");
    expect(localeMessages.uiDashboard).toBe("Dashboard");
  });
});
