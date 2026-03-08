import React from "react";
import { getLocaleMessages } from "@vnexus/shared";
import { AppShell } from "../../../../../../components/app-shell";
import { getSessionUser } from "../../../../../../lib/session";
import { getRequestLocale } from "../../../../../../lib/server/report-locale";
import { InvestigatorNarrativeClient } from "./investigator-narrative-client";
import { NarrativeDownloadLink } from "../../narrative-download-link";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function InvestigatorNarrativePage({ params }: PageProps) {
  const locale = await getRequestLocale();
  const localeMessages = getLocaleMessages(locale);
  const user = await getSessionUser();

  if (!user) {
    return (
      <AppShell heading={localeMessages.uiInvestigatorNarrativeHeading} subheading={localeMessages.uiAuthRequiredNarrative}>
        <p style={{ margin: 0, color: "var(--muted)" }}>{localeMessages.uiInvestigatorNarrativeRoleRequired}</p>
      </AppShell>
    );
  }

  if (user.role !== "investigator") {
    return (
      <AppShell
        heading={`403 | ${localeMessages.uiInvestigatorNarrativeHeading}`}
        subheading={localeMessages.uiInvestigatorNarrativeSubheading}
      >
        <p style={{ margin: 0, color: "var(--muted)" }}>{localeMessages.uiInvestigatorNarrativeRoleBlocked}</p>
      </AppShell>
    );
  }

  const { caseId } = await params;

  return (
    <AppShell heading={localeMessages.uiInvestigatorNarrativeHeading} subheading={localeMessages.uiInvestigatorNarrativeSubheading}>
      <div style={{ display: "grid", gap: "16px" }}>
        <div>
          <NarrativeDownloadLink caseId={caseId} audience="investigator" />
        </div>
        <InvestigatorNarrativeClient caseId={caseId} />
      </div>
    </AppShell>
  );
}
