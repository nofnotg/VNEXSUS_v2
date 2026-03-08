"use client";

import React from "react";
import type { CaseAnalytics } from "@vnexus/shared";
import { useLocaleMessages } from "../../../components/locale-provider";

type CaseAnalyticsClientProps = {
  analytics: CaseAnalytics;
};

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

function renderBarItems(items: Record<string, number>) {
  const entries = Object.entries(items);
  const max = Math.max(...entries.map(([, count]) => count), 1);

  return entries.map(([label, count]) => (
    <div key={label} style={{ display: "grid", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
        <span>{label}</span>
        <strong>{formatCount(count)}</strong>
      </div>
      <div style={{ height: "10px", borderRadius: "999px", background: "rgba(27, 26, 23, 0.08)", overflow: "hidden" }}>
        <div style={{ width: `${(count / max) * 100}%`, height: "100%", background: "var(--accent)" }} />
      </div>
    </div>
  ));
}

export function CaseAnalyticsClient({ analytics }: CaseAnalyticsClientProps) {
  const localeMessages = useLocaleMessages();
  const summaryCards = [
    { label: localeMessages.uiTotalCases, value: analytics.totalCases },
    { label: localeMessages.uiTotalEvents, value: analytics.totalEvents },
    { label: localeMessages.uiConfirmedEvents, value: analytics.confirmedEvents },
    { label: localeMessages.uiUnconfirmedEvents, value: analytics.unconfirmedEvents },
    { label: localeMessages.uiReviewRequiredEvents, value: analytics.reviewRequiredEvents }
  ];

  const hasAnalytics =
    analytics.totalCases > 0 ||
    analytics.totalEvents > 0 ||
    Object.keys(analytics.eventsByType).length > 0 ||
    Object.keys(analytics.eventsByHospital).length > 0;

  if (!hasAnalytics) {
    return (
      <div style={{ border: "1px dashed var(--border)", borderRadius: "16px", padding: "20px", color: "var(--muted)" }}>
        {localeMessages.uiAnalyticsEmpty}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px"
        }}
      >
        {summaryCards.map((item) => (
          <article
            key={item.label}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "18px",
              padding: "18px",
              background: "var(--surface)"
            }}
          >
            <div style={{ color: "var(--muted)", fontSize: "14px" }}>{item.label}</div>
            <div style={{ marginTop: "10px", fontSize: "32px", fontWeight: 700 }}>{formatCount(item.value)}</div>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        <article style={panelStyle}>
          <h2 style={panelTitleStyle}>{localeMessages.uiEventsByType}</h2>
          <div style={{ display: "grid", gap: "12px" }}>{renderBarItems(analytics.eventsByType)}</div>
        </article>

        <article style={panelStyle}>
          <h2 style={panelTitleStyle}>{localeMessages.uiEventsByHospital}</h2>
          <div style={{ display: "grid", gap: "12px" }}>{renderBarItems(analytics.eventsByHospital)}</div>
        </article>
      </section>
    </div>
  );
}

const panelStyle = {
  border: "1px solid var(--border)",
  borderRadius: "18px",
  padding: "20px",
  background: "var(--surface)",
  display: "grid",
  gap: "16px"
} as const;

const panelTitleStyle = {
  margin: 0,
  fontSize: "18px"
} as const;
