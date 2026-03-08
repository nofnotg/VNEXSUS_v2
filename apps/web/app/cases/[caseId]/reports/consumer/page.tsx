import React from "react";
import { getLocaleMessages } from "@vnexus/shared";
import { AppShell } from "../../../../../components/app-shell";
import { getRequestLocale } from "../../../../../lib/server/report-locale";
import { getSessionUser } from "../../../../../lib/session";
import { ConsumerReportClient } from "./consumer-report-client";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function ConsumerReportPage({ params }: PageProps) {
  const locale = await getRequestLocale();
  const localeMessages = getLocaleMessages(locale);
  const user = await getSessionUser();

  if (!user) {
    return (
      <AppShell heading={localeMessages.uiConsumerReportHeading} subheading={localeMessages.uiAuthRequiredReport}>
        <p style={{ margin: 0, color: "var(--muted)" }}>{localeMessages.uiConsumerReportRoleRequired}</p>
      </AppShell>
    );
  }

  if (user.role !== "consumer") {
    return (
      <AppShell heading={`403 | ${localeMessages.uiConsumerReportHeading}`} subheading={localeMessages.uiConsumerReportSubheading}>
        <p style={{ margin: 0, color: "var(--muted)" }}>{localeMessages.uiConsumerReportRoleBlocked}</p>
      </AppShell>
    );
  }

  const { caseId } = await params;

  return (
    <AppShell heading={localeMessages.uiConsumerReportHeading} subheading={localeMessages.uiConsumerReportSubheading}>
      <ConsumerReportClient caseId={caseId} />
    </AppShell>
  );
}
