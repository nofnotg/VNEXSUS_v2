"use client";

import Link from "next/link";
import React from "react";
import { ReactNode } from "react";
import { type LocaleCode } from "@vnexus/shared";
import { useLocale, useLocaleMessages } from "./locale-provider";

export function AppShell({
  heading,
  subheading,
  children
}: {
  heading: string;
  subheading: string;
  children: ReactNode;
}) {
  const { locale, setLocale } = useLocale();
  const localeMessages = useLocaleMessages();

  return (
    <main style={{ padding: "32px" }}>
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(27, 26, 23, 0.08)"
        }}
      >
        <header
          style={{
            padding: "24px 28px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px"
          }}
        >
          <div>
            <div style={{ fontSize: "12px", letterSpacing: "0.12em", color: "var(--muted)" }}>VNEXSUS V2</div>
            <h1 style={{ margin: "6px 0 0", fontSize: "28px" }}>{heading}</h1>
            <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>{subheading}</p>
          </div>
          <nav style={{ display: "flex", gap: "16px", color: "var(--muted)", alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/">{localeMessages.uiHome}</Link>
            <Link href="/cases">{localeMessages.uiCases}</Link>
            <Link href="/sign-in">{localeMessages.uiSignIn}</Link>
            <Link href="/dashboard">{localeMessages.uiDashboard}</Link>
            <Link href="/settings">{localeMessages.uiSettings}</Link>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--muted)" }}>
              <span>{localeMessages.uiLanguageLabel}</span>
              <select
                aria-label={localeMessages.uiLocaleSelectLabel}
                value={locale}
                onChange={(event) => setLocale(event.target.value as LocaleCode)}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "999px",
                  padding: "6px 12px",
                  background: "var(--surface)"
                }}
              >
                <option value="en">{localeMessages.uiLanguageEnglish}</option>
                <option value="ko">{localeMessages.uiLanguageKorean}</option>
              </select>
            </label>
          </nav>
        </header>
        <section style={{ padding: "28px" }}>{children}</section>
      </div>
    </main>
  );
}
