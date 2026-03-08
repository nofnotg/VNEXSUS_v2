"use client";

import React from "react";
import { useEffect, useState } from "react";
import type { ConsumerReportJson } from "@vnexus/shared";
import { getConsumerReport, ReportApiError } from "../../../../../lib/client/report-api";

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

export function ConsumerReportClient({ caseId }: Props) {
  const [report, setReport] = useState<ConsumerReportJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const role = await getCurrentUserRole();
        if (role !== "consumer") {
          throw new ReportApiError("403 | Consumer role is required", 403, "FORBIDDEN");
        }

        const nextReport = await getConsumerReport(caseId);
        if (!cancelled) {
          setReport(nextReport);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message = loadError instanceof Error ? loadError.message : "Failed to load consumer report";
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
    return <EmptyState message="Loading consumer report..." />;
  }

  if (error) {
    return <EmptyState message={error} />;
  }

  if (!report || report.sections.length === 0) {
    return <EmptyState message="No consumer report sections are available yet." />;
  }

  const timelineSection = report.sections.find((section) => section.sectionTitle === "timeline_summary");
  const overviewSection = report.sections.find((section) => section.sectionTitle !== "timeline_summary");

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "14px", color: "var(--muted)" }}>Case: {report.caseId}</span>
        <span style={{ fontSize: "14px", color: "var(--muted)" }}>Generated: {report.generatedAt}</span>
        <span style={{ fontSize: "14px", color: report.requiresReview ? "#9a3412" : "var(--muted)" }}>
          Review: {report.requiresReview ? "required" : "clear"}
        </span>
      </div>

      <article style={{ border: "1px solid var(--border)", borderRadius: "20px", padding: "20px", background: "var(--surface)" }}>
        <h2 style={{ marginTop: 0 }}>{timelineSection?.sectionTitle || "timeline_summary"}</h2>
        {timelineSection && timelineSection.summaryItems.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {timelineSection.summaryItems.map((item) => (
                <tr key={item.title}>
                  <th
                    scope="row"
                    style={{
                      textAlign: "left",
                      padding: "10px 0",
                      borderBottom: "1px solid var(--border)",
                      width: "260px",
                      color: "var(--muted)",
                      verticalAlign: "top"
                    }}
                  >
                    {item.title || "timeline item"}
                  </th>
                  <td style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>{item.value || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="No timeline summary items are available." />
        )}
      </article>

      <article style={{ border: "1px solid var(--border)", borderRadius: "20px", padding: "20px", background: "var(--surface)" }}>
        <h2 style={{ marginTop: 0 }}>{overviewSection?.sectionTitle || "consumer_overview"}</h2>

        {overviewSection && overviewSection.summaryItems.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: "18px" }}>
            {overviewSection.summaryItems.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>: {item.value || "-"}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState message="No overview summary items are available." />
        )}

        <div style={{ display: "grid", gap: "16px", marginTop: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <section>
            <h3 style={{ margin: "0 0 8px" }}>Risk signals</h3>
            {overviewSection && overviewSection.riskSignals.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                {overviewSection.riskSignals.map((signal) => (
                  <li key={signal}>{signal || "risk_signal"}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: "var(--muted)" }}>No risk signals.</p>
            )}
          </section>

          <section>
            <h3 style={{ margin: "0 0 8px" }}>Check points</h3>
            {overviewSection && overviewSection.checkPoints.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                {overviewSection.checkPoints.map((item) => (
                  <li key={item}>{item || "check_point"}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: "var(--muted)" }}>No check points.</p>
            )}
          </section>

          <section>
            <h3 style={{ margin: "0 0 8px" }}>Next actions</h3>
            {overviewSection && overviewSection.nextActions.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                {overviewSection.nextActions.map((item) => (
                  <li key={item}>{item || "next_action"}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: "var(--muted)" }}>No next actions.</p>
            )}
          </section>
        </div>
      </article>
    </div>
  );
}
