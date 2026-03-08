"use client";

import React from "react";
import { useState } from "react";
import type { CaseDetail, CaseEvent } from "@vnexus/shared";
import { useLocale, useLocaleMessages } from "../../../components/locale-provider";
import { updateCaseEventConfirmation, updateCaseEventDetails } from "../../../lib/client/case-detail-api";

type CaseDetailClientProps = {
  caseId: string;
  initialDetail: CaseDetail;
  canEdit: boolean;
  canViewHistory: boolean;
};

type FeedbackState = {
  kind: "success" | "error" | "pending";
  message: string;
};

type EditDraft = {
  date: string;
  hospital: string;
  details: string;
  requiresReview: boolean;
};

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ border: "1px dashed var(--border)", borderRadius: "16px", padding: "20px", color: "var(--muted)" }}>
      {message}
    </div>
  );
}

function buildEditDraft(event: CaseEvent): EditDraft {
  return {
    date: event.date,
    hospital: event.hospital,
    details: event.details,
    requiresReview: event.requiresReview
  };
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function hasChanges(event: CaseEvent, draft: EditDraft) {
  return (
    draft.date !== event.date ||
    draft.hospital !== event.hospital ||
    draft.details !== event.details ||
    draft.requiresReview !== event.requiresReview
  );
}

export function CaseDetailClient({ caseId, initialDetail, canEdit, canViewHistory }: CaseDetailClientProps) {
  const { locale } = useLocale();
  const localeMessages = useLocaleMessages();
  const [detail, setDetail] = useState<CaseDetail>(initialDetail);
  const [savingEventId, setSavingEventId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [historyEventId, setHistoryEventId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

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

  function startEdit(event: CaseEvent) {
    setEditingEventId(event.eventId);
    setDraft(buildEditDraft(event));
    setFeedback(null);
  }

  function cancelEdit() {
    setEditingEventId(null);
    setDraft(null);
  }

  async function saveEdit(event: CaseEvent) {
    if (!draft || !isValidDate(draft.date) || !hasChanges(event, draft)) {
      return;
    }

    const previousDetail = detail;
    const optimisticEvent: CaseEvent = {
      ...event,
      date: draft.date,
      hospital: draft.hospital.trim(),
      details: draft.details.trim(),
      requiresReview: draft.requiresReview
    };

    setDetail((current) => ({
      ...current,
      events: current.events.map((item) => (item.eventId === event.eventId ? optimisticEvent : item))
    }));
    setSavingEventId(event.eventId);
    setFeedback({ kind: "pending", message: localeMessages.uiConfirmationSaving });

    try {
      const updatedEvent = await updateCaseEventDetails(
        caseId,
        {
          eventId: event.eventId,
          date: draft.date,
          hospital: draft.hospital.trim(),
          details: draft.details.trim(),
          requiresReview: draft.requiresReview
        },
        event.editedAt
      );
      setDetail((current) => ({
        ...current,
        events: current.events.map((item) => (item.eventId === updatedEvent.eventId ? updatedEvent : item))
      }));
      setEditingEventId(null);
      setDraft(null);
      setFeedback({ kind: "success", message: localeMessages.uiEditSuccess });
    } catch (error) {
      setDetail(previousDetail);
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : localeMessages.uiEditError
      });
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
            const isEditing = editingEventId === event.eventId;
            const currentDraft = isEditing && draft ? draft : null;
            const draftHasChanges = currentDraft ? hasChanges(event, currentDraft) : false;
            const invalidDate = currentDraft ? !isValidDate(currentDraft.date) : false;

            return (
              <React.Fragment key={event.eventId}>
                <tr>
                  <td style={bodyCellStyle}>{new Date(`${event.date}T00:00:00.000Z`).toLocaleDateString(locale)}</td>
                  <td style={bodyCellStyle}>{event.type}</td>
                  <td style={bodyCellStyle}>{event.hospital}</td>
                  <td style={bodyCellStyle}>{event.details}</td>
                  <td style={bodyCellStyle}>{reviewLabel}</td>
                  <td style={bodyCellStyle}>
                    <div style={{ display: "grid", gap: "8px", justifyItems: "start" }}>
                      <span>{confirmationLabel}</span>
                      {canEdit ? (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
                          <button type="button" onClick={() => startEdit(event)} disabled={savingEventId === event.eventId} style={actionButtonStyle}>
                            {localeMessages.uiEditAction}
                          </button>
                        </div>
                      ) : null}
                      {canViewHistory && (event.editHistory?.length ?? 0) > 0 ? (
                        <button
                          type="button"
                          onClick={() => setHistoryEventId((current) => (current === event.eventId ? null : event.eventId))}
                          style={linkButtonStyle}
                        >
                          {historyEventId === event.eventId ? localeMessages.uiHideEditHistory : localeMessages.uiViewEditHistory}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>

                {isEditing && currentDraft ? (
                  <tr>
                    <td colSpan={6} style={{ ...bodyCellStyle, background: "rgba(27, 26, 23, 0.03)" }}>
                      <div style={{ display: "grid", gap: "12px" }}>
                        <label style={fieldStyle}>
                          <span>{localeMessages.uiEventDateLabel}</span>
                          <input
                            aria-label={localeMessages.uiEventDateLabel}
                            value={currentDraft.date}
                            onChange={(event) => setDraft((current) => (current ? { ...current, date: event.target.value } : current))}
                          />
                          {invalidDate ? <span style={{ color: "#8d2b22" }}>{localeMessages.uiInvalidDate}</span> : null}
                        </label>

                        <label style={fieldStyle}>
                          <span>{localeMessages.uiEventHospitalLabel}</span>
                          <input
                            aria-label={localeMessages.uiEventHospitalLabel}
                            value={currentDraft.hospital}
                            onChange={(event) => setDraft((current) => (current ? { ...current, hospital: event.target.value } : current))}
                          />
                        </label>

                        <label style={fieldStyle}>
                          <span>{localeMessages.uiEventDetailsLabel}</span>
                          <textarea
                            aria-label={localeMessages.uiEventDetailsLabel}
                            value={currentDraft.details}
                            onChange={(event) => setDraft((current) => (current ? { ...current, details: event.target.value } : current))}
                            rows={3}
                          />
                        </label>

                        <label style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                          <input
                            type="checkbox"
                            aria-label={localeMessages.uiEventReviewToggleLabel}
                            checked={currentDraft.requiresReview}
                            onChange={(event) =>
                              setDraft((current) => (current ? { ...current, requiresReview: event.target.checked } : current))
                            }
                          />
                          <span>{localeMessages.uiEventReviewToggleLabel}</span>
                        </label>

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => saveEdit(event)}
                            disabled={
                              savingEventId === event.eventId ||
                              invalidDate ||
                              !draftHasChanges ||
                              currentDraft.hospital.trim().length === 0 ||
                              currentDraft.details.trim().length === 0
                            }
                            style={actionButtonStyle}
                          >
                            {localeMessages.uiSaveAction}
                          </button>
                          <button type="button" onClick={cancelEdit} disabled={savingEventId === event.eventId} style={actionButtonStyle}>
                            {localeMessages.uiCancelAction}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}

                {canViewHistory && historyEventId === event.eventId && (event.editHistory?.length ?? 0) > 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...bodyCellStyle, background: "rgba(27, 26, 23, 0.03)" }}>
                      <div style={{ display: "grid", gap: "12px" }}>
                        <strong>{localeMessages.uiEditHistoryHeading}</strong>
                        {event.editHistory?.map((entry) => (
                          <div key={`${entry.editedBy}-${entry.editedAt}`} style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "12px" }}>
                            <div style={{ fontWeight: 600 }}>{entry.editedBy}</div>
                            <div style={{ color: "var(--muted)", fontSize: "14px" }}>
                              {new Date(entry.editedAt).toLocaleString(locale)}
                            </div>
                            <ul style={{ margin: "8px 0 0", paddingLeft: "18px" }}>
                              {Object.entries(entry.changes).map(([field, change]) => (
                                <li key={field}>
                                  {field}: {change.previousValue ?? "-"} -&gt; {change.nextValue ?? "-"}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
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

const linkButtonStyle = {
  border: "none",
  padding: 0,
  background: "transparent",
  color: "var(--muted)",
  cursor: "pointer",
  textDecoration: "underline"
} as const;

const fieldStyle = {
  display: "grid",
  gap: "6px"
} as const;
