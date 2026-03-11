"use client";

import React, { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { AnalyticsExportFileType, AnalyticsShareCandidate, CaseAnalytics, CaseAnalyticsFilter, CaseAnalyticsPreset, CaseAnalyticsTrend } from "@vnexus/shared";
import { formatMessage } from "@vnexus/shared";
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { useLocaleMessages } from "../../../components/locale-provider";
import {
  CaseAnalyticsApiError,
  createAnalyticsPreset,
  deleteAnalyticsPreset,
  downloadAnalyticsExport,
  getCaseAnalytics,
  getAnalyticsPresets,
  getSharedAnalyticsPresets,
  getCaseAnalyticsTrend,
  searchAnalyticsShareCandidates,
  shareAnalyticsPreset
} from "../../../lib/client/case-analytics-api";

type CaseAnalyticsClientProps = {
  initialAnalytics: CaseAnalytics;
  initialTrend: CaseAnalyticsTrend;
  initialFilter: CaseAnalyticsFilter;
  initialOwnedPresets: CaseAnalyticsPreset[];
  initialSharedPresets: CaseAnalyticsPreset[];
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

function mergeShareCandidates(current: AnalyticsShareCandidate[], incoming: AnalyticsShareCandidate[]) {
  const byId = new Map(current.map((item) => [item.userId, item]));

  for (const candidate of incoming) {
    byId.set(candidate.userId, candidate);
  }

  return [...byId.values()];
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (value >= 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${value} B`;
}

export function CaseAnalyticsClient({
  initialAnalytics,
  initialTrend,
  initialFilter,
  initialOwnedPresets,
  initialSharedPresets
}: CaseAnalyticsClientProps) {
  const localeMessages = useLocaleMessages();
  const [filter, setFilter] = useState<FilterState>(toFilterState(initialFilter));
  const [interval, setInterval] = useState<CaseAnalyticsTrend["interval"]>(initialTrend.interval);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [trend, setTrend] = useState(initialTrend);
  const [ownedPresets, setOwnedPresets] = useState(initialOwnedPresets);
  const [sharedPresets, setSharedPresets] = useState(initialSharedPresets);
  const [presetName, setPresetName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [exportType, setExportType] = useState<AnalyticsExportFileType>("csv");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadBytes, setDownloadBytes] = useState<{ received: number; total: number | null } | null>(null);
  const [activeSharePresetId, setActiveSharePresetId] = useState<string | null>(null);
  const [shareQuery, setShareQuery] = useState("");
  const [shareCandidates, setShareCandidates] = useState<AnalyticsShareCandidate[]>([]);
  const [shareSearchPage, setShareSearchPage] = useState(1);
  const [shareSearchHasMore, setShareSearchHasMore] = useState(false);
  const [shareSelection, setShareSelection] = useState<string[]>([]);
  const [refreshingPresets, setRefreshingPresets] = useState(false);
  const [lastExportRequest, setLastExportRequest] = useState<{
    fileType: AnalyticsExportFileType;
    filter: CaseAnalyticsFilter;
    interval: CaseAnalyticsTrend["interval"];
  } | null>(null);
  const [eventTypeOptions, setEventTypeOptions] = useState(() => Object.keys(initialAnalytics.eventsByType).sort((a, b) => a.localeCompare(b)));
  const [hospitalOptions, setHospitalOptions] = useState(() =>
    mergeOptions([], [
      ...Object.keys(initialAnalytics.eventsByHospital),
      ...initialAnalytics.topHospitals.map((item) => item.hospital)
    ])
  );
  const allPresets = useMemo(() => [...ownedPresets, ...sharedPresets], [ownedPresets, sharedPresets]);
  const deferredShareQuery = useDeferredValue(shareQuery);

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

  useEffect(() => {
    let cancelled = false;

    if (!activeSharePresetId || deferredShareQuery.trim().length < 2) {
      setShareCandidates([]);
      return;
    }

    void searchAnalyticsShareCandidates(deferredShareQuery.trim(), shareSearchPage)
      .then((result) => {
        if (!cancelled) {
          setShareCandidates((current) => (shareSearchPage === 1 ? result.items : mergeShareCandidates(current, result.items)));
          setShareSearchHasMore(result.hasMore);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setShareCandidates([]);
          setShareSearchHasMore(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeSharePresetId, deferredShareQuery, shareSearchPage]);

  async function refresh(nextFilter: FilterState, nextInterval: CaseAnalyticsTrend["interval"]) {
    setLoading(true);
    setError(null);
    setNotice(null);

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
      setNotice(null);
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const created = await createAnalyticsPreset({
        name: presetName.trim(),
        filter: toRequestFilter(filter),
        interval
      });
      startTransition(() => {
        setOwnedPresets((current) => [created, ...current.filter((preset) => preset.presetId !== created.presetId)]);
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
    setNotice(null);

    try {
      await deleteAnalyticsPreset(presetId);
      startTransition(() => {
        setOwnedPresets((current) => current.filter((preset) => preset.presetId !== presetId));
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
    const preset = allPresets.find((item) => item.presetId === presetId);
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

  function handleOpenSharePanel(preset: CaseAnalyticsPreset) {
    setActiveSharePresetId((current) => (current === preset.presetId ? null : preset.presetId));
    setShareSelection(preset.sharedWith);
    setShareQuery("");
    setShareCandidates([]);
    setShareSearchPage(1);
    setShareSearchHasMore(false);
    setError(null);
    setNotice(null);
  }

  function handleAddShareRecipient(candidate: AnalyticsShareCandidate) {
    setShareSelection((current) =>
      current.includes(candidate.email) ? current : [...current, candidate.email].sort((left, right) => left.localeCompare(right))
    );
    setShareQuery("");
    setShareCandidates([]);
    setShareSearchPage(1);
    setShareSearchHasMore(false);
  }

  function handleRemoveShareRecipient(email: string) {
    setShareSelection((current) => current.filter((item) => item !== email));
  }

  async function handleSharePreset(preset: CaseAnalyticsPreset) {
    const sharedWith = [...new Set(shareSelection)];

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      await shareAnalyticsPreset({
        presetId: preset.presetId,
        sharedWith
      });

      startTransition(() => {
        setOwnedPresets((current) =>
          current.map((item) =>
            item.presetId === preset.presetId
              ? {
                  ...item,
                  isShared: sharedWith.length > 0,
                  sharedWith
                }
              : item
          )
        );
      });
      setNotice(localeMessages.uiShareSuccess);
      setActiveSharePresetId(null);
    } catch (caught) {
      const message = caught instanceof CaseAnalyticsApiError ? caught.message : localeMessages.uiShareError;
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshPresets() {
    setRefreshingPresets(true);
    setError(null);
    setNotice(null);

    try {
      const [nextOwned, nextShared] = await Promise.all([getAnalyticsPresets(), getSharedAnalyticsPresets()]);
      startTransition(() => {
        setOwnedPresets(nextOwned);
        setSharedPresets(nextShared);
        setSelectedPresetId((current) =>
          nextOwned.some((preset) => preset.presetId === current) || nextShared.some((preset) => preset.presetId === current) ? current : ""
        );
      });
    } catch (caught) {
      const message = caught instanceof CaseAnalyticsApiError ? caught.message : localeMessages.uiAnalyticsError;
      setError(message);
    } finally {
      setRefreshingPresets(false);
    }
  }

  async function handleExport(
    exportRequest = {
      fileType: exportType,
      filter: toRequestFilter(filter),
      interval
    }
  ) {
    setLoading(true);
    setError(null);
    setNotice(null);
    setDownloadProgress(null);
    setDownloadBytes(null);
    setLastExportRequest(exportRequest);

    try {
      const file = await downloadAnalyticsExport({
        ...exportRequest,
        onProgress: (progress) => {
          setDownloadProgress(progress.percent);
          setDownloadBytes({
            received: progress.receivedBytes,
            total: progress.totalBytes
          });
        }
      });
      const objectUrl = URL.createObjectURL(file.blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setNotice(localeMessages.uiExportSuccess);
    } catch (caught) {
      const message = caught instanceof CaseAnalyticsApiError ? caught.message : localeMessages.uiExportError;
      setError(message);
    } finally {
      setLoading(false);
      setDownloadProgress(null);
      setDownloadBytes(null);
    }
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
              {allPresets.map((preset) => (
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
          <button type="button" onClick={() => void handleRefreshPresets()} disabled={loading || refreshingPresets}>
            {refreshingPresets ? localeMessages.uiRefreshingPresets : localeMessages.uiRefreshPresets}
          </button>
        </div>

        {ownedPresets.length > 0 ? (
          <div style={{ display: "grid", gap: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "16px" }}>{localeMessages.uiMyPresets}</h3>
            <div style={{ display: "grid", gap: "12px" }}>
              {ownedPresets.map((preset) => (
                <article key={preset.presetId} style={presetCardStyle}>
                  <strong>{preset.name}</strong>
                  {preset.sharedWith.length > 0 ? (
                    <span style={{ color: "var(--muted)", fontSize: "14px" }}>
                      {localeMessages.uiSharedWith}: {preset.sharedWith.join(", ")}
                    </span>
                  ) : null}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button type="button" onClick={() => void handleApplyPreset(preset.presetId)} disabled={loading}>
                      {localeMessages.uiSelectPreset}
                    </button>
                    <button type="button" onClick={() => handleOpenSharePanel(preset)} disabled={loading}>
                      {localeMessages.uiSharePreset}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeletePreset(preset.presetId)}
                      disabled={loading}
                      aria-label={`${localeMessages.uiDeletePreset} ${preset.name}`}
                    >
                      {localeMessages.uiDeletePreset}
                    </button>
                  </div>
                  {activeSharePresetId === preset.presetId ? (
                    <div style={{ display: "grid", gap: "10px" }}>
                      <label style={{ display: "grid", gap: "6px" }}>
                        <span>{localeMessages.uiShareSearchPlaceholder}</span>
                        <input
                          type="text"
                          value={shareQuery}
                          onChange={(event) => {
                            setShareQuery(event.target.value);
                            setShareSearchPage(1);
                          }}
                          placeholder={localeMessages.uiShareSearchPlaceholder}
                        />
                      </label>
                      {shareCandidates.length > 0 ? (
                        <div style={{ display: "grid", gap: "6px" }}>
                          {shareCandidates.map((candidate) => (
                            <button
                              key={candidate.userId}
                              type="button"
                              onClick={() => handleAddShareRecipient(candidate)}
                              style={shareCandidateButtonStyle}
                            >
                              {candidate.displayName ? `${candidate.displayName} (${candidate.email})` : candidate.email}
                            </button>
                          ))}
                          {shareSearchHasMore ? (
                            <button type="button" onClick={() => setShareSearchPage((current) => current + 1)} style={shareCandidateButtonStyle}>
                              {localeMessages.uiShareLoadMore}
                            </button>
                          ) : null}
                        </div>
                      ) : shareQuery.trim().length >= 2 ? (
                        <div style={{ color: "var(--muted)", fontSize: "14px" }}>{localeMessages.uiShareNoMatches}</div>
                      ) : null}
                      <div style={{ display: "grid", gap: "6px" }}>
                        <strong style={{ fontSize: "14px" }}>{localeMessages.uiShareSelectedUsers}</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {shareSelection.map((email) => (
                            <button key={email} type="button" onClick={() => handleRemoveShareRecipient(email)} style={shareChipStyle}>
                              {email}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <button type="button" onClick={() => void handleSharePreset(preset)} disabled={loading || shareSelection.length === 0}>
                          {localeMessages.uiSharePreset}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {sharedPresets.length > 0 ? (
          <div style={{ display: "grid", gap: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "16px" }}>{localeMessages.uiSharedPresets}</h3>
            <div style={{ display: "grid", gap: "12px" }}>
              {sharedPresets.map((preset) => (
                <article key={preset.presetId} style={presetCardStyle}>
                  <strong>{preset.name}</strong>
                  {preset.sharedWith.length > 0 ? (
                    <span style={{ color: "var(--muted)", fontSize: "14px" }}>
                      {localeMessages.uiSharedWith}: {preset.sharedWith.join(", ")}
                    </span>
                  ) : null}
                  <div>
                    <button type="button" onClick={() => void handleApplyPreset(preset.presetId)} disabled={loading}>
                      {localeMessages.uiSelectPreset}
                    </button>
                  </div>
                </article>
              ))}
            </div>
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
          <select
            aria-label={localeMessages.uiExport}
            value={exportType}
            onChange={(event) => setExportType(event.target.value as AnalyticsExportFileType)}
            disabled={loading}
          >
            <option value="csv">{localeMessages.uiExportCsv}</option>
            <option value="xlsx">{localeMessages.uiExportXlsx}</option>
          </select>
          <button type="button" onClick={() => void handleExport()} disabled={loading}>
            {localeMessages.uiExport}
          </button>
          {error && lastExportRequest ? (
            <button type="button" onClick={() => void handleExport(lastExportRequest)} disabled={loading}>
              {localeMessages.uiRetryExport}
            </button>
          ) : null}
        </div>

        {error ? <p style={{ margin: 0, color: "#b42318" }}>{error}</p> : null}
        {notice ? <p style={{ margin: 0, color: "#166534" }}>{notice}</p> : null}
        {loading && downloadProgress === null ? <p style={{ margin: 0, color: "var(--muted)" }}>{localeMessages.uiExportPreparing}</p> : null}
        {loading && downloadProgress !== null ? (
          <div style={{ display: "grid", gap: "4px", color: "var(--muted)" }}>
            <p style={{ margin: 0 }}>{formatMessage(localeMessages.uiExportDownloading, { progress: String(downloadProgress) })}</p>
            {downloadBytes ? (
              <p style={{ margin: 0, fontSize: "14px" }}>
                {formatMessage(localeMessages.uiExportProgressDetail, {
                  received: formatBytes(downloadBytes.received),
                  total: downloadBytes.total ? formatBytes(downloadBytes.total) : "unknown"
                })}
              </p>
            ) : null}
          </div>
        ) : null}
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

const presetCardStyle = {
  border: "1px solid var(--border)",
  borderRadius: "14px",
  padding: "14px",
  display: "grid",
  gap: "10px"
} as const;

const shareCandidateButtonStyle = {
  textAlign: "left",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "10px",
  background: "rgba(255,255,255,0.7)"
} as const;

const shareChipStyle = {
  border: "1px solid var(--border)",
  borderRadius: "999px",
  padding: "6px 10px",
  background: "rgba(20, 83, 45, 0.08)"
} as const;
