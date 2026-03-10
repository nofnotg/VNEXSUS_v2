"use client";

import React, { startTransition, useMemo, useState } from "react";
import type { CaseAnalytics, CaseAnalyticsFilter, CaseAnalyticsPreset, CaseAnalyticsTrend } from "@vnexus/shared";
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { useLocaleMessages } from "../../../components/locale-provider";
import {
  CaseAnalyticsApiError,
  createAnalyticsPreset,
  deleteAnalyticsPreset,
  getCaseAnalytics,
  getCaseAnalyticsTrend
} from "../../../lib/client/case-analytics-api";

type CaseAnalyticsClientProps = {
  initialAnalytics: CaseAnalytics;
  initialTrend: CaseAnalyticsTrend;
  initialFilter: CaseAnalyticsFilter;
  initialPresets: CaseAnalyticsPreset[];
};

type FilterState = {
  startDate: string;
  endDate: string;
  eventTypes: string[];
  hospitals: string[];
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

function toFilterState(filter: CaseAnalyticsFilter): FilterState {
  return {
    startDate: filter.startDate ?? "",
    endDate: filter.endDate ?? "",
    eventTypes: filter.eventTypes ?? [],
    hospitals: filter.hospitals ?? []
  };
}

function toRequestFilter(filter: FilterState): CaseAnalyticsFilter {
  return {
    startDate: filter.startDate || undefined,
    endDate: filter.endDate || undefined,
    eventTypes: filter.eventTypes.length > 0 ? filter.eventTypes : undefined,
    hospitals: filter.hospitals.length > 0 ? filter.hospitals : undefined
  };
}

function mergeOptions(current: string[], incoming: string[]) {
  return [...new Set([...current, ...incoming])].sort((left, right) => left.localeCompare(right));
}

export function CaseAnalyticsClient({
  initialAnalytics,
  initialTrend,
  initialFilter,
  initialPresets
}: CaseAnalyticsClientProps) {
  const localeMessages = useLocaleMessages();
  const [filter, setFilter] = useState<FilterState>(toFilterState(initialFilter));
  const [interval, setInterval] = useState<CaseAnalyticsTrend["interval"]>(initialTrend.interval);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [trend, setTrend] = useState(initialTrend);
  const [presets, setPresets] = useState(initialPresets);
  const [presetName, setPresetName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventTypeOptions, setEventTypeOptions] = useState(() => Object.keys(initialAnalytics.eventsByType).sort((a, b) => a.localeCompare(b)));
  const [hospitalOptions, setHospitalOptions] = useState(() =>
    mergeOptions([], [
      ...Object.keys(initialAnalytics.eventsByHospital),
      ...initialAnalytics.topHospitals.map((item) => item.hospital)
    ])
  );

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

  const chartData = useMemo(
    () =>
      trend.points.map((point) => ({
        date: point.date,
        [localeMessages.uiTrendTotal]: point.total,
        [localeMessages.uiTrendConfirmed]: point.confirmed,
        [localeMessages.uiTrendUnconfirmed]: point.unconfirmed
      })),
    [localeMessages.uiTrendConfirmed, localeMessages.uiTrendTotal, localeMessages.uiTrendUnconfirmed, trend.points]
  );

  const chartWidth = Math.max(480, trend.points.length * 80);

  async function refresh(nextFilter: FilterState, nextInterval: CaseAnalyticsTrend["interval"]) {
    setLoading(true);
    setError(null);

    try {
      const requestFilter = toRequestFilter(nextFilter);
      const [nextAnalytics, nextTrend] = await Promise.all([
        getCaseAnalytics(requestFilter),
        getCaseAnalyticsTrend(requestFilter, nextInterval)
      ]);

      startTransition(() => {
        setAnalytics(nextAnalytics);
        setTrend(nextTrend);
        setEventTypeOptions((current) => mergeOptions(current, Object.keys(nextAnalytics.eventsByType)));
        setHospitalOptions((current) =>
          mergeOptions(current, [
            ...Object.keys(nextAnalytics.eventsByHospital),
            ...nextAnalytics.topHospitals.map((item) => item.hospital)
          ])
        );
      });
    } catch (caught) {
      const message = caught instanceof CaseAnalyticsApiError ? caught.message : localeMessages.uiAnalyticsError;
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleMultiSelectChange(
    event: React.ChangeEvent<HTMLSelectElement>,
    key: "eventTypes" | "hospitals"
  ) {
    const values = Array.from(event.target.selectedOptions, (option) => option.value);
    setFilter((current) => ({
      ...current,
      [key]: values
    }));
  }

  async function handleSavePreset() {
    if (!presetName.trim()) {
      setError(localeMessages.uiPresetNameRequired);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await createAnalyticsPreset({
        name: presetName.trim(),
        filter: toRequestFilter(filter),
        interval
      });
      startTransition(() => {
        setPresets((current) => [created, ...current.filter((preset) => preset.presetId !== created.presetId)]);
        setPresetName("");
        setSelectedPresetId(created.presetId);
      });
    } catch (caught) {
      const message = caught instanceof CaseAnalyticsApiError ? caught.message : localeMessages.uiAnalyticsError;
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePreset(presetId: string) {
    setLoading(true);
    setError(null);

    try {
      await deleteAnalyticsPreset(presetId);
      startTransition(() => {
        setPresets((current) => current.filter((preset) => preset.presetId !== presetId));
        setSelectedPresetId((current) => (current === presetId ? "" : current));
      });
    } catch (caught) {
      const message = caught instanceof CaseAnalyticsApiError ? caught.message : localeMessages.uiAnalyticsError;
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyPreset(presetId: string) {
    const preset = presets.find((item) => item.presetId === presetId);
    if (!preset) {
      return;
    }

    const nextFilter = toFilterState(preset.filter);
    setSelectedPresetId(presetId);
    setFilter(nextFilter);
    setInterval(preset.interval);
    await refresh(nextFilter, preset.interval);
  }

  async function handleHospitalDrillDown(hospital: string) {
    const nextFilter = {
      ...filter,
      hospitals: [hospital]
    };
    setFilter(nextFilter);
    await refresh(nextFilter, interval);
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <section style={panelStyle}>
        <h2 style={panelTitleStyle}>{localeMessages.uiAnalyticsPresets}</h2>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "end" }}>
          <div style={fieldStyle}>
            <label htmlFor="analytics-preset-select">{localeMessages.uiAnalyticsPresets}</label>
            <select
              id="analytics-preset-select"
              value={selectedPresetId}
              onChange={(event) => {
                void handleApplyPreset(event.target.value);
              }}
            >
              <option value="">{localeMessages.uiSelectPreset}</option>
              {presets.map((preset) => (
                <option key={preset.presetId} value={preset.presetId}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label htmlFor="analytics-preset-name">{localeMessages.uiPresetName}</label>
            <input
              id="analytics-preset-name"
              type="text"
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
              placeholder={localeMessages.uiPresetName}
            />
          </div>

          <button type="button" onClick={() => void handleSavePreset()} disabled={loading}>
            {localeMessages.uiSavePreset}
          </button>
        </div>

        {presets.length > 0 ? (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {presets.map((preset) => (
              <button
                key={preset.presetId}
                type="button"
                onClick={() => void handleDeletePreset(preset.presetId)}
                disabled={loading}
                aria-label={`${localeMessages.uiDeletePreset} ${preset.name}`}
              >
                {localeMessages.uiDeletePreset}: {preset.name}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section style={panelStyle}>
        <h2 style={panelTitleStyle}>{localeMessages.uiAnalyticsFilters}</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "end" }}>
          <div style={fieldStyle}>
            <label htmlFor="analytics-start-date">{localeMessages.uiStartDate}</label>
            <input
              id="analytics-start-date"
              type="date"
              value={filter.startDate}
              onChange={(event) => setFilter((current) => ({ ...current, startDate: event.target.value }))}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="analytics-end-date">{localeMessages.uiEndDate}</label>
            <input
              id="analytics-end-date"
              type="date"
              value={filter.endDate}
              onChange={(event) => setFilter((current) => ({ ...current, endDate: event.target.value }))}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="analytics-event-types">{localeMessages.uiEventTypes}</label>
            <select
              id="analytics-event-types"
              multiple
              value={filter.eventTypes}
              onChange={(event) => handleMultiSelectChange(event, "eventTypes")}
              style={{ minHeight: "112px" }}
            >
              {eventTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label htmlFor="analytics-hospitals">{localeMessages.uiHospitals}</label>
            <select
              id="analytics-hospitals"
              multiple
              value={filter.hospitals}
              onChange={(event) => handleMultiSelectChange(event, "hospitals")}
              style={{ minHeight: "112px" }}
            >
              {hospitalOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label htmlFor="analytics-interval">{localeMessages.uiTrendInterval}</label>
            <select
              id="analytics-interval"
              value={interval}
              onChange={(event) => setInterval(event.target.value as CaseAnalyticsTrend["interval"])}
            >
              <option value="daily">{localeMessages.uiTrendDaily}</option>
              <option value="weekly">{localeMessages.uiTrendWeekly}</option>
              <option value="monthly">{localeMessages.uiTrendMonthly}</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button type="button" onClick={() => void refresh(filter, interval)} disabled={loading}>
            {loading ? localeMessages.uiAnalyticsLoading : localeMessages.uiApplyFilters}
          </button>
          <button
            type="button"
            onClick={() => {
              const resetFilter = toFilterState(initialFilter);
              setFilter(resetFilter);
              setInterval("daily");
              void refresh(resetFilter, "daily");
            }}
            disabled={loading}
          >
            {localeMessages.uiClearFilters}
          </button>
        </div>

        {error ? <p style={{ margin: 0, color: "#b42318" }}>{error}</p> : null}
      </section>

      {analytics.topHospitals.length > 0 ? (
        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>{localeMessages.uiTopHospitals}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {analytics.topHospitals.map((item) => (
              <article key={item.hospital} style={{ border: "1px solid var(--border)", borderRadius: "16px", padding: "16px" }}>
                <div style={{ fontWeight: 700 }}>{item.hospital}</div>
                <div style={{ marginTop: "8px", color: "var(--muted)" }}>
                  {localeMessages.uiEvents}: {formatCount(item.events)}
                </div>
                <button type="button" style={{ marginTop: "12px" }} onClick={() => void handleHospitalDrillDown(item.hospital)} disabled={loading}>
                  {localeMessages.uiViewDetails}
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!hasAnalytics ? (
        <div style={{ border: "1px dashed var(--border)", borderRadius: "16px", padding: "20px", color: "var(--muted)" }}>
          {localeMessages.uiAnalyticsEmpty}
        </div>
      ) : (
        <>
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

          <section style={panelStyle}>
            <h2 style={panelTitleStyle}>{localeMessages.uiTrendHeading}</h2>
            <div style={{ overflowX: "auto" }}>
              <LineChart width={chartWidth} height={280} data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(27, 26, 23, 0.12)" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={localeMessages.uiTrendTotal} stroke="#14532d" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey={localeMessages.uiTrendConfirmed} stroke="#1d4ed8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey={localeMessages.uiTrendUnconfirmed} stroke="#b45309" strokeWidth={2} dot={false} />
              </LineChart>
            </div>
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
        </>
      )}
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

const fieldStyle = {
  display: "grid",
  gap: "8px",
  minWidth: "180px",
  flex: "1 1 180px"
} as const;
