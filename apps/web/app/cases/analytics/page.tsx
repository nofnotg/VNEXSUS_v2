import React from "react";
import { getLocaleMessages } from "@vnexus/shared";
import { AppShell } from "../../../components/app-shell";
import { getDefaultAnalyticsFilter } from "../../../lib/server/case-analytics-query";
import { getRequestLocale } from "../../../lib/server/report-locale";
import { getSessionUser } from "../../../lib/session";
import { getCaseAnalytics, getCaseAnalyticsTrend } from "../../../lib/server/services/case-analytics-service";
import { getPresetsForUser, getSharedPresets } from "../../../lib/server/services/analytics-preset-service";
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

  const defaultFilter = getDefaultAnalyticsFilter();
  const [analytics, trend, presets, sharedPresets] = await Promise.all([
    getCaseAnalytics(user.id, user.role, defaultFilter),
    getCaseAnalyticsTrend(user.id, user.role, defaultFilter, "daily"),
    getPresetsForUser(user.id),
    getSharedPresets(user.id)
  ]);

  return (
    <AppShell heading={localeMessages.uiAnalyticsHeading} subheading={localeMessages.uiAnalyticsSubheading}>
      <CaseAnalyticsClient
        initialAnalytics={analytics}
        initialTrend={trend}
        initialFilter={defaultFilter}
        initialOwnedPresets={presets}
        initialSharedPresets={sharedPresets}
      />
    </AppShell>
  );
}
