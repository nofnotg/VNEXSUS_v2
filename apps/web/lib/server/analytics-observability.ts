type MetricCounter = {
  count: number;
  failures: number;
  bytes: number;
  rows: number;
  cacheHits: number;
  cacheMisses: number;
  totalDurationMs: number;
  maxDurationMs: number;
  lastDurationMs: number;
  lastUpdatedAt: string | null;
};

export type AnalyticsMetricKey =
  | "preset_share"
  | "preset_share_search"
  | "export_request"
  | "export_complete"
  | "preset_cache_owned"
  | "preset_cache_shared"
  | "query_preset_lookup"
  | "query_shared_preset_lookup"
  | "query_share_candidate_lookup"
  | "query_case_analytics"
  | "query_case_analytics_trend";

const metrics = new Map<AnalyticsMetricKey, MetricCounter>();

function getMetric(key: AnalyticsMetricKey) {
  const existing = metrics.get(key);
  if (existing) {
    return existing;
  }

  const created: MetricCounter = {
    count: 0,
    failures: 0,
    bytes: 0,
    rows: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalDurationMs: 0,
    maxDurationMs: 0,
    lastDurationMs: 0,
    lastUpdatedAt: null
  };
  metrics.set(key, created);
  return created;
}

export function getAnalyticsObservabilityConfig() {
  return {
    slowQueryMs: Number(process.env.ANALYTICS_SLOW_QUERY_MS ?? 400)
  };
}

export function recordAnalyticsMetric(
  key: AnalyticsMetricKey,
  options?: {
    failed?: boolean;
    bytes?: number;
    rows?: number;
    durationMs?: number;
    cache?: "hit" | "miss";
  }
) {
  const metric = getMetric(key);
  metric.count += 1;
  metric.failures += options?.failed ? 1 : 0;
  metric.bytes += options?.bytes ?? 0;
  metric.rows += options?.rows ?? 0;
  metric.totalDurationMs += options?.durationMs ?? 0;
  metric.maxDurationMs = Math.max(metric.maxDurationMs, options?.durationMs ?? 0);
  metric.lastDurationMs = options?.durationMs ?? metric.lastDurationMs;
  metric.cacheHits += options?.cache === "hit" ? 1 : 0;
  metric.cacheMisses += options?.cache === "miss" ? 1 : 0;
  metric.lastUpdatedAt = new Date().toISOString();
}

function sanitizePayload(payload: Record<string, unknown>) {
  const next: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) {
      continue;
    }

    if (typeof value === "string" && /(email|query|name)/i.test(key)) {
      continue;
    }

    next[key] = value;
  }

  return next;
}

export function logAnalyticsEvent(
  event: string,
  payload: Record<string, unknown>,
  level: "info" | "error" = "info"
) {
  const serialized = JSON.stringify({
    scope: "analytics",
    event,
    ...sanitizePayload(payload),
    timestamp: new Date().toISOString()
  });

  if (level === "error") {
    console.error(serialized);
    return;
  }

  console.info(serialized);
}

export async function sendAnalyticsAlert(
  event: string,
  payload: Record<string, unknown>
) {
  const webhookUrl = process.env.ANALYTICS_ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: `[analytics] ${event}`,
        event,
        payload: sanitizePayload(payload),
        timestamp: new Date().toISOString()
      })
    });
  } catch {
    logAnalyticsEvent("analytics.alert.delivery_failed", { event }, "error");
  }
}

export async function measureAnalyticsOperation<T>(
  event: string,
  action: () => Promise<T>,
  options?: {
    metricKey?: AnalyticsMetricKey;
    slowThresholdMs?: number;
    payload?: Record<string, unknown>;
    rows?: number;
  }
) {
  const startedAt = Date.now();
  const heapBefore = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  const slowThresholdMs = options?.slowThresholdMs ?? getAnalyticsObservabilityConfig().slowQueryMs;

  try {
    const result = await action();
    const durationMs = Date.now() - startedAt;
    const heapAfter = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

    if (options?.metricKey) {
      recordAnalyticsMetric(options.metricKey, {
        durationMs,
        ...(options.rows === undefined ? {} : { rows: options.rows })
      });
    }

    logAnalyticsEvent(event, {
      ...options?.payload,
      durationMs,
      heapUsedMb: heapAfter,
      heapDeltaMb: heapAfter - heapBefore,
      slow: durationMs >= slowThresholdMs
    });

    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    if (options?.metricKey) {
      recordAnalyticsMetric(options.metricKey, {
        failed: true,
        durationMs,
        ...(options.rows === undefined ? {} : { rows: options.rows })
      });
    }

    logAnalyticsEvent(
      `${event}.failed`,
      {
        ...options?.payload,
        durationMs,
        slow: durationMs >= slowThresholdMs,
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: error instanceof Error ? error.message : "Unknown analytics error"
      },
      "error"
    );
    await sendAnalyticsAlert(event, {
      ...options?.payload,
      durationMs,
      errorName: error instanceof Error ? error.name : "UnknownError"
    });
    throw error;
  }
}

export function getAnalyticsMetricsSnapshot() {
  return Object.fromEntries(metrics.entries());
}

export function formatAnalyticsMetricsPrometheus() {
  const lines = [
    "# HELP analytics_operation_total Total analytics operations by type.",
    "# TYPE analytics_operation_total counter",
    "# HELP analytics_operation_failures_total Failed analytics operations by type.",
    "# TYPE analytics_operation_failures_total counter",
    "# HELP analytics_operation_duration_ms_total Total duration in milliseconds for analytics operations.",
    "# TYPE analytics_operation_duration_ms_total counter",
    "# HELP analytics_operation_duration_ms_max Maximum duration in milliseconds for analytics operations.",
    "# TYPE analytics_operation_duration_ms_max gauge",
    "# HELP analytics_operation_bytes_total Total exported bytes by type.",
    "# TYPE analytics_operation_bytes_total counter",
    "# HELP analytics_operation_rows_total Total processed rows by type.",
    "# TYPE analytics_operation_rows_total counter",
    "# HELP analytics_cache_hits_total Cache hits by analytics cache type.",
    "# TYPE analytics_cache_hits_total counter",
    "# HELP analytics_cache_misses_total Cache misses by analytics cache type.",
    "# TYPE analytics_cache_misses_total counter"
  ];

  for (const [key, metric] of metrics.entries()) {
    lines.push(`analytics_operation_total{operation="${key}"} ${metric.count}`);
    lines.push(`analytics_operation_failures_total{operation="${key}"} ${metric.failures}`);
    lines.push(`analytics_operation_duration_ms_total{operation="${key}"} ${metric.totalDurationMs}`);
    lines.push(`analytics_operation_duration_ms_max{operation="${key}"} ${metric.maxDurationMs}`);
    lines.push(`analytics_operation_bytes_total{operation="${key}"} ${metric.bytes}`);
    lines.push(`analytics_operation_rows_total{operation="${key}"} ${metric.rows}`);
    lines.push(`analytics_cache_hits_total{operation="${key}"} ${metric.cacheHits}`);
    lines.push(`analytics_cache_misses_total{operation="${key}"} ${metric.cacheMisses}`);
  }

  return `${lines.join("\n")}\n`;
}
