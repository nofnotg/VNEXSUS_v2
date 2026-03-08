import type { Metadata } from "next";
import { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { LocaleProvider } from "../components/locale-provider";
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

  return (
    <html lang={initialLocale}>
      <body>
        <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
