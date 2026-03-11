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
- In-process metrics are collected for request and failure counts.
- Admin users can inspect the current metrics snapshot at `/api/cases/analytics/metrics`.
- The current metrics store is process-local. Production monitoring should scrape or forward these counters into the platform monitoring system.

## Client UX

- The share dialog now uses teammate search instead of free-text prompt entry.
- Selected recipients are shown as removable chips before the share request is submitted.
- Export download shows preparing/downloading feedback and a completion notice after the browser download link is created.
- Shared presets remain read/apply-oriented in this release. Edit and unshare management are deferred to the next epic.

## Deployment Checklist

1. Run `pnpm db:generate`.
2. Apply Prisma migrations including `0015_analytics_preset_indexes`.
3. Run `pnpm typecheck`.
4. Run `pnpm test:epic17`.
5. Confirm `/api/cases/analytics/metrics` is reachable by admin users in staging.
6. Validate export behavior with a large analytics dataset in staging and confirm memory does not spike abnormally.
7. Decide whether production needs a shared cache/metrics backend before horizontal scaling.

## Known Follow-up Items

- Replace the in-memory metrics store with the production monitoring sink.
- Replace the in-memory preset cache with a shared cache in multi-node deployments.
- Add preset unshare/edit management UI in the next analytics collaboration epic.
