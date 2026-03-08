import React from "react";
import { AppShell } from "../../../../../components/app-shell";
import { getSessionUser } from "../../../../../lib/session";
import { InvestigatorReportClient } from "./investigator-report-client";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function InvestigatorReportPage({ params }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    return (
      <AppShell heading="Investigator Report" subheading="Authentication is required to view this report.">
        <p style={{ margin: 0, color: "var(--muted)" }}>Please sign in with an investigator account.</p>
      </AppShell>
    );
  }

  if (user.role !== "investigator") {
    return (
      <AppShell heading="403 | Investigator Report" subheading="This report page is restricted to investigator users.">
        <p style={{ margin: 0, color: "var(--muted)" }}>Your current role cannot open investigator report JSON.</p>
      </AppShell>
    );
  }

  const { caseId } = await params;

  return (
    <AppShell heading="Investigator Report" subheading="Structured JSON view for investigator-only review.">
      <InvestigatorReportClient caseId={caseId} />
    </AppShell>
  );
}
