# Analytics Sharing And Export Release Notes

## Scope

- Epic 3-17 hardens analytics preset sharing and analytics export for release preparation.
- This document covers the permission model, performance safeguards, observability points, and deployment checks for the analytics dashboard.

## Permission Model

- Dashboard access remains limited to `investigator` and `admin`.
- Preset sharing only allows recipients who are:
  - active users
  - not `consumer`
  - members of at least one organization shared with the preset owner
- The share search endpoint returns only users inside the requester's organization boundary.
- Share requests reject:
  - unknown email addresses
  - users outside the current organization scope
  - inactive users
  - consumer-role users
- Export requests are revalidated on the server before file generation.
- Export filters must stay inside the requester's accessible analytics scope for event types and hospitals.

## Performance Safeguards

- CSV and XLSX exports are written to a temporary workspace and streamed back to the client.
- Export range is limited to 366 days.
- Explicit `eventTypes` and `hospitals` filters are limited to 20 values each.
- Analytics preset lookups use:
  - Prisma indexes on owner/shared sort paths
  - a short-lived in-memory cache for owned and shared preset lists
- For multi-instance deployment, replace the in-memory cache with Redis or another shared cache.

## Observability

- Structured server logs are emitted for:
  - `preset.share.completed`
  - `preset.share.search`
  - `analytics.export.requested`
  - `analytics.export.completed`
  - `analytics.export.failed`
- Query and service timing logs now include duration, heap usage, heap delta, and a slow-operation flag for:
  - preset lookup
  - shared preset lookup
  - share candidate lookup
  - analytics aggregate query
  - analytics trend query
  - export scope validation
  - csv/xlsx build stages
- In-process metrics are collected for request and failure counts.
- In-process metrics also track bytes, rows, cache hits/misses, total duration, and max duration per analytics operation.
- Admin users can inspect the current metrics snapshot at `/api/cases/analytics/metrics`.
- Prometheus-compatible text output is available at `/api/cases/analytics/metrics?format=prometheus`.
- The current metrics store is process-local. Production monitoring should scrape or forward these counters into the platform monitoring system.
- Recommended metric names for dashboards and alerts:
  - `analytics_operation_total`
  - `analytics_operation_failures_total`
  - `analytics_operation_duration_ms_total`
  - `analytics_operation_duration_ms_max`
  - `analytics_operation_bytes_total`
  - `analytics_cache_hits_total`
  - `analytics_cache_misses_total`
- Suggested Grafana panels:
  - export duration p95 / max
  - export failure count by file type
  - share search volume
  - preset cache hit ratio
  - slow analytics operation count
- If `ANALYTICS_ALERT_WEBHOOK_URL` is configured, analytics failures attempt to send a sanitized webhook payload suitable for Slack-compatible relays or internal webhook bridges.

## Client UX

- The share dialog now uses teammate search instead of free-text prompt entry.
- Share search supports paged loading so large teammate lists do not need to render in one request.
- Selected recipients are shown as removable chips before the share request is submitted.
- The presets area includes a manual refresh action so reviewers can bypass cache TTL while validating team changes.
- Export download shows preparing/downloading feedback, byte-level progress text when possible, a completion notice after the browser download link is created, and a retry action after failures.
- Shared presets remain read/apply-oriented in this release. Edit and unshare management are deferred to the next epic.

## Deployment Checklist

1. Run `pnpm db:generate`.
2. Apply Prisma migrations including `0015_analytics_preset_indexes`.
3. Run `pnpm typecheck`.
4. Run `pnpm test:epic17`.
5. Confirm `/api/cases/analytics/metrics` is reachable by admin users in staging.
6. Confirm Prometheus scrape compatibility with `/api/cases/analytics/metrics?format=prometheus`.
7. Validate export behavior with a large analytics dataset in staging and confirm memory does not spike abnormally.
8. Set alert thresholds for export failures and slow analytics operations.
9. Decide whether production needs a shared cache/metrics backend before horizontal scaling.

## Runtime Settings

- `ANALYTICS_PRESET_CACHE_TTL_MS`
  - default `60000`
  - controls in-memory preset cache TTL
- `ANALYTICS_EXPORT_MAX_DAYS`
  - default `366`
  - rejects export requests over the configured date span
- `ANALYTICS_EXPORT_MAX_FILTER_VALUES`
  - default `20`
  - limits requested event type / hospital values in export filters
- `ANALYTICS_SLOW_QUERY_MS`
  - default `400`
  - marks analytics operations as slow in logs
- `ANALYTICS_ALERT_WEBHOOK_URL`
  - optional
  - sends sanitized failure alerts to a webhook endpoint

## Resource Notes

- CSV export is streamed from a temporary file and usually stays close to the size of the generated file plus small buffering overhead.
- XLSX export still uses workbook construction before writing the temp file, so staging load tests should pay special attention to heap growth on large trend windows.
- The current preset cache and metrics store are process-local. Multi-instance production should move both to shared infrastructure before relying on cross-node consistency.

## Known Follow-up Items

- Replace the in-memory metrics store with the production monitoring sink.
- Replace the in-memory preset cache with a shared cache in multi-node deployments.
- Add preset unshare/edit management UI in the next analytics collaboration epic.
