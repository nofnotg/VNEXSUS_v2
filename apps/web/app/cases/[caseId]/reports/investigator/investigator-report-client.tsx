"use client";

import React from "react";
import { useEffect, useState } from "react";
import type { InvestigatorReportJson } from "@vnexus/shared";
import { getInvestigatorReport, ReportApiError } from "../../../../../lib/client/report-api";

type SessionResponse = {
  success: boolean;
  data?: {
    user?: {
      role?: string;
    };
  };
  error?: {
    code?: string;
    message?: string;
  };
};

type Props = {
  caseId: string;
};

async function getCurrentUserRole() {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store"
  });

  const json = (await response.json().catch(() => null)) as SessionResponse | null;

  if (!response.ok) {
    throw new ReportApiError(json?.error?.message ?? "Failed to verify session", response.status, json?.error?.code);
  }

  return json?.data?.user?.role ?? null;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ border: "1px dashed var(--border)", borderRadius: "16px", padding: "20px", color: "var(--muted)" }}>
      {message}
    </div>
  );
}

export function InvestigatorReportClient({ caseId }: Props) {
  const [report, setReport] = useState<InvestigatorReportJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const role = await getCurrentUserRole();
        if (role !== "investigator") {
          throw new ReportApiError("403 | Investigator role is required", 403, "FORBIDDEN");
        }

        const nextReport = await getInvestigatorReport(caseId);
        if (!cancelled) {
          setReport(nextReport);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message = loadError instanceof Error ? loadError.message : "Failed to load investigator report";
          setError(message);
          setReport(null);
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
  }, [caseId]);

  if (isLoading) {
    return <EmptyState message="Loading investigator report..." />;
  }

  if (error) {
    return <EmptyState message={error} />;
  }

  if (!report || report.sections.length === 0) {
    return <EmptyState message="No investigator report sections are available yet." />;
  }

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "14px", color: "var(--muted)" }}>Case: {report.caseId}</span>
        <span style={{ fontSize: "14px", color: "var(--muted)" }}>Generated: {report.generatedAt}</span>
        <span style={{ fontSize: "14px", color: report.requiresReview ? "#9a3412" : "var(--muted)" }}>
          Review: {report.requiresReview ? "required" : "clear"}
        </span>
      </div>

      {report.sections.map((section, index) => {
        const entries = section.entries.filter((entry) => entry.label.trim().length > 0);

        return (
          <article
            key={`${section.sectionTitle}-${index}`}
            style={{ border: "1px solid var(--border)", borderRadius: "20px", padding: "20px", background: "var(--surface)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>{section.sectionTitle || "Untitled section"}</h2>
              <span style={{ fontSize: "13px", color: section.requiresReview ? "#9a3412" : "var(--muted)" }}>
                {section.requiresReview ? "Manual review required" : "Reviewed"}
              </span>
            </div>

            {entries.length > 0 ? (
              <table style={{ width: "100%", marginTop: "16px", borderCollapse: "collapse" }}>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={`${section.sectionTitle}-${entry.label}`}>
                      <th
                        scope="row"
                        style={{
                          textAlign: "left",
                          padding: "10px 0",
                          borderBottom: "1px solid var(--border)",
                          width: "180px",
                          color: "var(--muted)",
                          verticalAlign: "top"
                        }}
                      >
                        {entry.label}
                      </th>
                      <td style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>{entry.value || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="No structured entries are available for this section." />
            )}

            {section.notes.length > 0 ? (
              <ul style={{ margin: "16px 0 0", paddingLeft: "18px", color: "var(--muted)" }}>
                {section.notes.map((note) => (
                  <li key={note}>{note || "Review note pending"}</li>
                ))}
              </ul>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
