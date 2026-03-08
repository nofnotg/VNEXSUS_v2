import React from "react";
import { ApiError, getLocaleMessages } from "@vnexus/shared";
import { AppShell } from "../../components/app-shell";
import { getRequestLocale } from "../../lib/server/report-locale";
import { getSessionUser } from "../../lib/session";
import { CaseListClient } from "./case-list-client";

export default async function CasesPage() {
  const locale = await getRequestLocale();
  const localeMessages = getLocaleMessages(locale);
  const user = await getSessionUser();

  if (!user) {
    return (
      <AppShell heading={localeMessages.uiCasesHeading} subheading={localeMessages.uiAuthRequiredReport}>
        <p style={{ margin: 0, color: "var(--muted)" }}>{localeMessages.uiInvestigatorReportRoleRequired}</p>
      </AppShell>
    );
  }

  if (!["consumer", "investigator", "admin"].includes(user.role)) {
    throw new ApiError("FORBIDDEN", "This role cannot open case list");
  }

  return (
    <AppShell heading={localeMessages.uiCasesHeading} subheading={localeMessages.uiCasesSubheading}>
      <CaseListClient />
    </AppShell>
  );
}
