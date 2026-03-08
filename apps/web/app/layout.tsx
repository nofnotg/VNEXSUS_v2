import type { Metadata } from "next";
import { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { LocaleProvider } from "../components/locale-provider";
import { ThemeProvider, type ThemeMode } from "../components/theme-provider";
import { resolveReportLocale } from "../lib/server/report-locale";
import "./globals.css";

export const metadata: Metadata = {
  title: "VNEXSUS V2",
  description: "Medical document timeline and evidence platform"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const initialLocale = resolveReportLocale(
    null,
    cookieStore.get("vnexus_lang")?.value,
    headerStore.get("accept-language")
  );
  const initialTheme = (cookieStore.get("vnexus_theme")?.value === "dark" ? "dark" : "light") as ThemeMode;

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
