"use client";

import React from "react";
import { useLocaleMessages, useLocale } from "../../../../components/locale-provider";

type Props = {
  caseId: string;
  audience: "investigator" | "consumer";
};

export function NarrativeDownloadLink({ caseId, audience }: Props) {
  const { locale } = useLocale();
  const localeMessages = useLocaleMessages();

  return (
    <a
      href={`/api/cases/${caseId}/reports/${audience}/narrative/pdf?lang=${locale}`}
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
      {localeMessages.uiDownloadPdf}
    </a>
  );
}
