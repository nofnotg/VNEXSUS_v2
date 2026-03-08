import React from "react";
import { AppShell } from "../../../../../components/app-shell";
import { getSessionUser } from "../../../../../lib/session";
import { ConsumerReportClient } from "./consumer-report-client";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function ConsumerReportPage({ params }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    return (
      <AppShell heading="Consumer Report" subheading="Authentication is required to view this report.">
        <p style={{ margin: 0, color: "var(--muted)" }}>Please sign in with a consumer account.</p>
      </AppShell>
    );
  }

  if (user.role !== "consumer") {
    return (
      <AppShell heading="403 | Consumer Report" subheading="This report page is restricted to consumer users.">
        <p style={{ margin: 0, color: "var(--muted)" }}>Your current role cannot open consumer report JSON.</p>
      </AppShell>
    );
  }

  const { caseId } = await params;

  return (
    <AppShell heading="Consumer Report" subheading="Structured JSON view for consumer-safe review.">
      <ConsumerReportClient caseId={caseId} />
    </AppShell>
  );
}
