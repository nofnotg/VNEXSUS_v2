import React from "react";
import { getLocaleMessages } from "@vnexus/shared";
import { AppShell } from "../../../components/app-shell";
import { getRequestLocale } from "../../../lib/server/report-locale";
import { getSessionUser } from "../../../lib/session";
import { getCaseAnalytics } from "../../../lib/server/services/case-analytics-service";
import { CaseAnalyticsClient } from "./case-analytics-client";

export default async function CaseAnalyticsPage() {
  const locale = await getRequestLocale();
  const localeMessages = getLocaleMessages(locale);
  const user = await getSessionUser();

  if (!user) {
    return (
      <AppShell heading={localeMessages.uiAnalyticsHeading} subheading={localeMessages.uiAnalyticsSubheading}>
        <p style={{ margin: 0, color: "var(--muted)" }}>{localeMessages.uiInvestigatorReportRoleRequired}</p>
      </AppShell>
    );
  }

  if (!["investigator", "admin"].includes(user.role)) {
    return (
      <AppShell heading={`403 | ${localeMessages.uiAnalyticsHeading}`} subheading={localeMessages.uiAnalyticsSubheading}>
        <p style={{ margin: 0, color: "var(--muted)" }}>{localeMessages.uiInvestigatorReportRoleBlocked}</p>
      </AppShell>
    );
  }

  const analytics = await getCaseAnalytics(user.id, user.role);

  return (
    <AppShell heading={localeMessages.uiAnalyticsHeading} subheading={localeMessages.uiAnalyticsSubheading}>
      <CaseAnalyticsClient analytics={analytics} />
    </AppShell>
  );
}
