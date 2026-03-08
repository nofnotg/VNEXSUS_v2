import React from "react";
import { AppShell } from "../../../../../../components/app-shell";
import { getSessionUser } from "../../../../../../lib/session";
import { ConsumerNarrativeClient } from "./consumer-narrative-client";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function ConsumerNarrativePage({ params }: PageProps) {
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

  return (
    <AppShell heading="Consumer Narrative" subheading="Template-based narrative derived from consumer report JSON.">
      <ConsumerNarrativeClient caseId={caseId} />
    </AppShell>
  );
}
