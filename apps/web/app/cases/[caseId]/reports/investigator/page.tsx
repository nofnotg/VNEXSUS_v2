import React from "react";
import { getLocaleMessages } from "@vnexus/shared";
import { AppShell } from "../../../../../components/app-shell";
import { getRequestLocale } from "../../../../../lib/server/report-locale";
import { getSessionUser } from "../../../../../lib/session";
import { InvestigatorReportClient } from "./investigator-report-client";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function InvestigatorReportPage({ params }: PageProps) {
  const locale = await getRequestLocale();
  const localeMessages = getLocaleMessages(locale);
  const user = await getSessionUser();

  if (!user) {
    return (
      <AppShell heading={localeMessages.uiInvestigatorReportHeading} subheading={localeMessages.uiAuthRequiredReport}>
        <p style={{ margin: 0, color: "var(--muted)" }}>{localeMessages.uiInvestigatorReportRoleRequired}</p>
      </AppShell>
    );
  }

  if (user.role !== "investigator") {
    return (
      <AppShell heading={`403 | ${localeMessages.uiInvestigatorReportHeading}`} subheading={localeMessages.uiInvestigatorReportSubheading}>
        <p style={{ margin: 0, color: "var(--muted)" }}>{localeMessages.uiInvestigatorReportRoleBlocked}</p>
      </AppShell>
    );
  }

  const { caseId } = await params;

  return (
    <AppShell heading={localeMessages.uiInvestigatorReportHeading} subheading={localeMessages.uiInvestigatorReportSubheading}>
      <InvestigatorReportClient caseId={caseId} />
    </AppShell>
  );
}
