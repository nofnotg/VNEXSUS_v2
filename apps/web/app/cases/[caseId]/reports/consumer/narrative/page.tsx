import React from "react";
import { isLocaleCode, messages, type LocaleCode } from "@vnexus/shared";
import { AppShell } from "../../../../../../components/app-shell";
import { getSessionUser } from "../../../../../../lib/session";
import { ConsumerNarrativeClient } from "./consumer-narrative-client";

type PageProps = {
  params: Promise<{ caseId: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export default async function ConsumerNarrativePage({ params, searchParams }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    return (
      <AppShell heading="Consumer Narrative" subheading="Authentication is required to view this narrative.">
        <p style={{ margin: 0, color: "var(--muted)" }}>Please sign in with a consumer account.</p>
      </AppShell>
    );
  }

  if (user.role !== "consumer") {
    return (
      <AppShell heading="403 | Consumer Narrative" subheading="This narrative page is restricted to consumer users.">
        <p style={{ margin: 0, color: "var(--muted)" }}>Your current role cannot open consumer narrative output.</p>
      </AppShell>
    );
  }

  const { caseId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const lang = isLocaleCode(resolvedSearchParams?.lang) ? resolvedSearchParams?.lang : "en";
  const locale = messages[lang as LocaleCode];
  const languageOptions: LocaleCode[] = ["en", "ko"];

  return (
    <AppShell heading="Consumer Narrative" subheading="Template-based narrative derived from consumer report JSON.">
      <div style={{ display: "grid", gap: "16px" }}>
        {resolvedSearchParams?.lang && !isLocaleCode(resolvedSearchParams.lang) ? (
          <p style={{ margin: 0, color: "#9a3412" }}>{messages.en.uiInvalidLanguage}</p>
        ) : null}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: "var(--muted)", fontSize: "0.95rem" }}>{locale.uiLanguageLabel}</span>
          {languageOptions.map((option) => (
            <a
              key={option}
              href={`/cases/${caseId}/reports/consumer/narrative?lang=${option}`}
              style={{
                color: option === lang ? "inherit" : "var(--muted)",
                fontWeight: option === lang ? 700 : 500,
                textDecoration: "none"
              }}
            >
              {option === "en" ? locale.uiLanguageEnglish : locale.uiLanguageKorean}
            </a>
          ))}
        </div>
        <div>
          <a
            href={`/api/cases/${caseId}/reports/consumer/narrative/pdf?lang=${lang}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 16px",
              borderRadius: "999px",
              border: "1px solid var(--border)",
              color: "inherit",
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            {locale.uiDownloadPdf}
          </a>
        </div>
        <ConsumerNarrativeClient caseId={caseId} lang={lang} />
      </div>
    </AppShell>
  );
}
