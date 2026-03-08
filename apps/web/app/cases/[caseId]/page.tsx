import React from "react";
import { ApiError, getLocaleMessages } from "@vnexus/shared";
import { AppShell } from "../../../components/app-shell";
import { getRequestLocale } from "../../../lib/server/report-locale";
import { getSessionUser } from "../../../lib/session";
import { getCaseDetail } from "../../../lib/server/services/case-detail-service";
import { CaseDetailClient } from "./case-detail-client";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseDetailPage({ params }: PageProps) {
  const locale = await getRequestLocale();
  const localeMessages = getLocaleMessages(locale);
  const user = await getSessionUser();

  if (!user) {
    return (
      <AppShell heading={localeMessages.uiCaseDetailHeading} subheading={localeMessages.uiCaseDetailSubheading}>
        <p style={{ margin: 0, color: "var(--muted)" }}>{localeMessages.uiAuthRequiredReport}</p>
      </AppShell>
    );
  }

  if (!["consumer", "investigator", "admin"].includes(user.role)) {
    throw new ApiError("FORBIDDEN", "This role cannot open case detail");
  }

  const { caseId } = await params;
  const detail = await getCaseDetail(caseId, user.id, user.role);

  return (
    <AppShell heading={localeMessages.uiCaseDetailHeading} subheading={localeMessages.uiCaseDetailSubheading}>
      <CaseDetailClient
        caseId={caseId}
        initialDetail={detail}
        canEdit={user.role === "investigator" || user.role === "admin"}
        canViewHistory={user.role === "admin"}
      />
    </AppShell>
  );
}
