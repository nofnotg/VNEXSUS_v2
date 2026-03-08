"use client";

import React from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CaseListItem } from "@vnexus/shared";
import { getCaseList, CaseListApiError } from "../../lib/client/case-list-api";
import { useLocale, useLocaleMessages } from "../../components/locale-provider";

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ border: "1px dashed var(--border)", borderRadius: "16px", padding: "20px", color: "var(--muted)" }}>
      {message}
    </div>
  );
}

function resolveStatusLabel(item: CaseListItem, localeMessages: ReturnType<typeof useLocaleMessages>) {
  if (item.status === "ready") {
    return localeMessages.uiStatusReady;
  }

  if (item.status === "processing") {
    return localeMessages.uiStatusProcessing;
  }

  if (item.status === "review_required") {
    return localeMessages.uiStatusReviewRequired;
  }

  return localeMessages.uiStatusDraft;
}

export function CaseListClient() {
  const { locale } = useLocale();
  const localeMessages = useLocaleMessages();
  const [items, setItems] = useState<CaseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getCaseList();
        if (!cancelled) {
          setItems(data.items);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message = loadError instanceof Error ? loadError.message : localeMessages.uiCasesLoadError;
          setError(message);
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <EmptyState message={localeMessages.uiCasesLoading} />;
  }

  if (error) {
    return <EmptyState message={error} />;
  }

  if (items.length === 0) {
    return <EmptyState message={localeMessages.uiCasesEmpty} />;
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={headerCellStyle}>{localeMessages.uiCaseIdColumn}</th>
          <th style={headerCellStyle}>{localeMessages.uiHospitalColumn}</th>
          <th style={headerCellStyle}>{localeMessages.uiUploadDateColumn}</th>
          <th style={headerCellStyle}>{localeMessages.uiStatusColumn}</th>
          <th style={headerCellStyle}>{localeMessages.uiAudienceColumn}</th>
          <th style={headerCellStyle}>{localeMessages.uiActionsColumn}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const audienceLabel =
            item.audience === "investigator" ? localeMessages.uiAudienceInvestigator : localeMessages.uiAudienceConsumer;
          const reportBase = `/cases/${item.caseId}/reports/${item.audience}`;
          const narrativeBase = `${reportBase}/narrative`;

          return (
            <tr key={item.caseId}>
              <td style={bodyCellStyle}>
                <Link href={`/cases/${item.caseId}`}>{item.caseId}</Link>
              </td>
              <td style={bodyCellStyle}>{item.hospitalName ?? "-"}</td>
              <td style={bodyCellStyle}>{new Date(item.uploadDate).toLocaleString(locale)}</td>
              <td style={bodyCellStyle}>{resolveStatusLabel(item, localeMessages)}</td>
              <td style={bodyCellStyle}>{audienceLabel}</td>
              <td style={bodyCellStyle}>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <Link href={reportBase}>{localeMessages.uiActionReport}</Link>
                  {item.hasNarrative ? <Link href={narrativeBase}>{localeMessages.uiActionNarrative}</Link> : <span>-</span>}
                  {item.hasPdf ? (
                    <a href={`/api/cases/${item.caseId}/reports/${item.audience}/narrative/pdf?lang=${locale}`}>
                      {localeMessages.uiActionPdf}
                    </a>
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const headerCellStyle = {
  textAlign: "left",
  padding: "12px 0",
  borderBottom: "1px solid var(--border)",
  color: "var(--muted)"
} as const;

const bodyCellStyle = {
  padding: "14px 0",
  borderBottom: "1px solid var(--border)"
} as const;
