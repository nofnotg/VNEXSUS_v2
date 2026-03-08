import React from "react";
import { AppShell } from "../../../../../../components/app-shell";
import { getSessionUser } from "../../../../../../lib/session";
import { InvestigatorNarrativeClient } from "./investigator-narrative-client";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function InvestigatorNarrativePage({ params }: PageProps) {
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

  return (
    <AppShell heading="Investigator Narrative" subheading="Template-based narrative derived from investigator report JSON.">
      <div style={{ display: "grid", gap: "16px" }}>
        <div>
          <a
            href={`/api/cases/${caseId}/reports/investigator/narrative/pdf`}
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
            Download PDF
          </a>
        </div>
        <InvestigatorNarrativeClient caseId={caseId} />
      </div>
    </AppShell>
  );
}
