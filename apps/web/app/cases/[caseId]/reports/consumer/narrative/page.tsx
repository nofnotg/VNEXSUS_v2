import React from "react";
import { getLocaleMessages } from "@vnexus/shared";
import { AppShell } from "../../../../../../components/app-shell";
import { getSessionUser } from "../../../../../../lib/session";
import { getRequestLocale } from "../../../../../../lib/server/report-locale";
import { ConsumerNarrativeClient } from "./consumer-narrative-client";
import { NarrativeDownloadLink } from "../../narrative-download-link";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function ConsumerNarrativePage({ params }: PageProps) {
  const locale = await getRequestLocale();
  const localeMessages = getLocaleMessages(locale);
  const user = await getSessionUser();

  if (!user) {
    return (
      <AppShell heading={localeMessages.uiConsumerNarrativeHeading} subheading={localeMessages.uiAuthRequiredNarrative}>
        <p style={{ margin: 0, color: "var(--muted)" }}>{localeMessages.uiConsumerNarrativeRoleRequired}</p>
      </AppShell>
    );
  }

  if (user.role !== "consumer") {
    return (
      <AppShell
        heading={`403 | ${localeMessages.uiConsumerNarrativeHeading}`}
        subheading={localeMessages.uiConsumerNarrativeSubheading}
      >
        <p style={{ margin: 0, color: "var(--muted)" }}>{localeMessages.uiConsumerNarrativeRoleBlocked}</p>
      </AppShell>
    );
  }

  const { caseId } = await params;

  return (
    <AppShell heading={localeMessages.uiConsumerNarrativeHeading} subheading={localeMessages.uiConsumerNarrativeSubheading}>
      <div style={{ display: "grid", gap: "16px" }}>
        <div>
          <NarrativeDownloadLink caseId={caseId} audience="consumer" />
        </div>
        <ConsumerNarrativeClient caseId={caseId} />
      </div>
    </AppShell>
  );
}
