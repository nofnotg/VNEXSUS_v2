import React from "react";
import { isLocaleCode, messages, type LocaleCode } from "@vnexus/shared";
import { AppShell } from "../../../../../../components/app-shell";
import { getSessionUser } from "../../../../../../lib/session";
import { InvestigatorNarrativeClient } from "./investigator-narrative-client";

type PageProps = {
  params: Promise<{ caseId: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export default async function InvestigatorNarrativePage({ params, searchParams }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    return (
      <AppShell heading="Investigator Narrative" subheading="Authentication is required to view this narrative.">
        <p style={{ margin: 0, color: "var(--muted)" }}>Please sign in with an investigator account.</p>
      </AppShell>
    );
  }

  if (user.role !== "investigator") {
    return (
      <AppShell heading="403 | Investigator Narrative" subheading="This narrative page is restricted to investigator users.">
        <p style={{ margin: 0, color: "var(--muted)" }}>Your current role cannot open investigator narrative output.</p>
      </AppShell>
    );
  }

  const { caseId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const lang = isLocaleCode(resolvedSearchParams?.lang) ? resolvedSearchParams?.lang : "en";
  const locale = messages[lang as LocaleCode];
  const languageOptions: LocaleCode[] = ["en", "ko"];

  return (
    <AppShell heading="Investigator Narrative" subheading="Template-based narrative derived from investigator report JSON.">
      <div style={{ display: "grid", gap: "16px" }}>
        {resolvedSearchParams?.lang && !isLocaleCode(resolvedSearchParams.lang) ? (
          <p style={{ margin: 0, color: "#9a3412" }}>{messages.en.uiInvalidLanguage}</p>
        ) : null}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: "var(--muted)", fontSize: "0.95rem" }}>{locale.uiLanguageLabel}</span>
          {languageOptions.map((option) => (
            <a
              key={option}
              href={`/cases/${caseId}/reports/investigator/narrative?lang=${option}`}
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
            href={`/api/cases/${caseId}/reports/investigator/narrative/pdf?lang=${lang}`}
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
        <InvestigatorNarrativeClient caseId={caseId} lang={lang} />
      </div>
    </AppShell>
  );
}
