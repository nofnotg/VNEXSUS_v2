// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../components/locale-provider";
import { ThemeProvider } from "../../components/theme-provider";
import SettingsPage from "./page.js";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn()
}));

vi.mock("../../lib/server/report-locale", () => ({
  getRequestLocale: getRequestLocaleMock
}));

describe("settings page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    document.cookie = "vnexus_lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "vnexus_theme=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.documentElement.dataset.theme = "light";
  });

  it("saves locale and theme preferences to provider state and storage", async () => {
    getRequestLocaleMock.mockResolvedValue("en");

    const ui = await SettingsPage();

    render(
      <ThemeProvider initialTheme="light">
        <LocaleProvider initialLocale="en">{ui}</LocaleProvider>
      </ThemeProvider>
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Language" }), {
      target: { value: "ko" }
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Theme" }), {
      target: { value: "dark" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    await waitFor(() => {
      expect(screen.getByText("설정을 저장했다.")).toBeTruthy();
    });

    expect(window.localStorage.getItem("vnexus_lang")).toBe("ko");
    expect(window.localStorage.getItem("vnexus_theme")).toBe("dark");
    expect(document.cookie).toContain("vnexus_lang=ko");
    expect(document.cookie).toContain("vnexus_theme=dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
