type MetricCounter = {
  count: number;
  failures: number;
  bytes: number;
  lastUpdatedAt: string | null;
};

type AnalyticsMetricKey =
  | "preset_share"
  | "preset_share_search"
  | "export_request"
  | "export_complete";

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
    lastUpdatedAt: null
  };
  metrics.set(key, created);
  return created;
}

export function recordAnalyticsMetric(
  key: AnalyticsMetricKey,
  options?: {
    failed?: boolean;
    bytes?: number;
  }
) {
  const metric = getMetric(key);
  metric.count += 1;
  metric.failures += options?.failed ? 1 : 0;
  metric.bytes += options?.bytes ?? 0;
  metric.lastUpdatedAt = new Date().toISOString();
}

export function logAnalyticsEvent(
  event: string,
  payload: Record<string, unknown>,
  level: "info" | "error" = "info"
) {
  const serialized = JSON.stringify({
    scope: "analytics",
    event,
    ...payload,
    timestamp: new Date().toISOString()
  });

  if (level === "error") {
    console.error(serialized);
    return;
  }

  console.info(serialized);
}

export function getAnalyticsMetricsSnapshot() {
  return Object.fromEntries(metrics.entries());
}
