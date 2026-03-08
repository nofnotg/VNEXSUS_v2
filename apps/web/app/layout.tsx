import type { Metadata } from "next";
import { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { LocaleProvider } from "../components/locale-provider";
import { ThemeProvider, type ThemeMode } from "../components/theme-provider";
import { resolveReportLocale } from "../lib/server/report-locale";
import { getUserPreferences } from "../lib/server/services/user-preferences-service";
import { requireSessionRecord } from "../lib/server/session-user";
import "./globals.css";

export const metadata: Metadata = {
  title: "VNEXSUS V2",
  description: "Medical document timeline and evidence platform"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const sessionRecord = await requireSessionRecord().catch(() => null);
  const preferences = sessionRecord ? await getUserPreferences(sessionRecord.user.id).catch(() => null) : null;
  const initialLocale =
    preferences?.locale
    ?? resolveReportLocale(null, cookieStore.get("vnexus_lang")?.value, headerStore.get("accept-language"));
  const initialTheme = (preferences?.theme
    ?? (cookieStore.get("vnexus_theme")?.value === "dark" ? "dark" : "light")) as ThemeMode;

  return (
    <html lang={initialLocale}>
      <body>
        <ThemeProvider initialTheme={initialTheme}>
          <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
