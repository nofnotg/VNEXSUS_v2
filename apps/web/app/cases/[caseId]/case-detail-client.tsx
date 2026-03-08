"use client";

import React from "react";
import { useState } from "react";
import type { CaseDetail } from "@vnexus/shared";
import { useLocale, useLocaleMessages } from "../../../components/locale-provider";
import { updateCaseEventConfirmation } from "../../../lib/client/case-detail-api";

type CaseDetailClientProps = {
  caseId: string;
  initialDetail: CaseDetail;
  canEdit: boolean;
};

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ border: "1px dashed var(--border)", borderRadius: "16px", padding: "20px", color: "var(--muted)" }}>
      {message}
    </div>
  );
}

export function CaseDetailClient({ caseId, initialDetail, canEdit }: CaseDetailClientProps) {
  const { locale } = useLocale();
  const localeMessages = useLocaleMessages();
  const [detail, setDetail] = useState<CaseDetail>(initialDetail);
  const [savingEventId, setSavingEventId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error" | "pending"; message: string } | null>(null);

  async function handleToggle(eventId: string, nextConfirmed: boolean) {
    const previousDetail = detail;

    setDetail((current) => ({
      ...current,
      events: current.events.map((item) => (item.eventId === eventId ? { ...item, confirmed: nextConfirmed } : item))
    }));
    setSavingEventId(eventId);
    setFeedback({ kind: "pending", message: localeMessages.uiConfirmationSaving });

    try {
      await updateCaseEventConfirmation(caseId, eventId, nextConfirmed);
      setFeedback({ kind: "success", message: localeMessages.uiConfirmationSaved });
    } catch {
      setDetail(previousDetail);
      setFeedback({ kind: "error", message: localeMessages.uiConfirmationFailed });
    } finally {
      setSavingEventId(null);
    }
  }

  if (detail.events.length === 0) {
    return <EmptyState message={localeMessages.uiCaseDetailEmpty} />;
  }

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <section style={{ display: "grid", gap: "8px" }}>
        <div style={{ color: "var(--muted)", fontSize: "14px" }}>{localeMessages.uiCaseLabel}</div>
        <div style={{ fontSize: "18px", fontWeight: 700 }}>{detail.caseId}</div>
        <div style={{ color: "var(--muted)" }}>{detail.hospitalName ?? "-"}</div>
      </section>

      {feedback ? (
        <div
          role="status"
          style={{
            padding: "12px 14px",
            borderRadius: "14px",
            border: "1px solid var(--border)",
            background: feedback.kind === "error" ? "rgba(196, 62, 47, 0.08)" : "rgba(25, 120, 74, 0.08)",
            color: feedback.kind === "error" ? "#8d2b22" : "var(--foreground)"
          }}
        >
          {feedback.message}
        </div>
      ) : null}

      <h2 style={{ margin: 0, fontSize: "20px" }}>{localeMessages.uiCaseDetailTimelineHeading}</h2>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={headerCellStyle}>{localeMessages.uiEventDateColumn}</th>
            <th style={headerCellStyle}>{localeMessages.uiEventTypeColumn}</th>
            <th style={headerCellStyle}>{localeMessages.uiHospitalColumn}</th>
            <th style={headerCellStyle}>{localeMessages.uiEventDetailsColumn}</th>
            <th style={headerCellStyle}>{localeMessages.uiEventRequiresReviewColumn}</th>
            <th style={headerCellStyle}>{localeMessages.uiEventConfirmedColumn}</th>
          </tr>
        </thead>
        <tbody>
          {detail.events.map((event) => {
            const reviewLabel = event.requiresReview
              ? localeMessages.uiEventRequiresReview
              : localeMessages.uiEventNoReview;
            const confirmationLabel = event.confirmed
              ? localeMessages.uiEventConfirmed
              : localeMessages.uiEventUnconfirmed;

            return (
              <tr key={event.eventId}>
                <td style={bodyCellStyle}>{new Date(`${event.date}T00:00:00.000Z`).toLocaleDateString(locale)}</td>
                <td style={bodyCellStyle}>{event.type}</td>
                <td style={bodyCellStyle}>{event.hospital}</td>
                <td style={bodyCellStyle}>{event.details}</td>
                <td style={bodyCellStyle}>{reviewLabel}</td>
                <td style={bodyCellStyle}>
                  <div style={{ display: "grid", gap: "8px", justifyItems: "start" }}>
                    <span>{confirmationLabel}</span>
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => handleToggle(event.eventId, !event.confirmed)}
                        disabled={savingEventId === event.eventId}
                        style={actionButtonStyle}
                      >
                        {savingEventId === event.eventId
                          ? localeMessages.uiConfirmationSaving
                          : event.confirmed
                            ? localeMessages.uiUnconfirmAction
                            : localeMessages.uiConfirmAction}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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
  borderBottom: "1px solid var(--border)",
  verticalAlign: "top"
} as const;

const actionButtonStyle = {
  border: "1px solid var(--border)",
  borderRadius: "999px",
  padding: "8px 12px",
  background: "var(--surface)",
  cursor: "pointer"
} as const;
