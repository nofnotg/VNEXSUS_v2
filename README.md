# VNEXSUS V2

## Localization

Narrative JSON builders, PDF export routes, and the report UI support `en` and `ko`.

- Narrative API examples:
  - `/api/cases/:caseId/reports/investigator/narrative?lang=en`
  - `/api/cases/:caseId/reports/consumer/narrative?lang=ko`
- PDF export examples:
  - `/api/cases/:caseId/reports/investigator/narrative/pdf?lang=en`
  - `/api/cases/:caseId/reports/consumer/narrative/pdf?lang=ko`
- UI language selection:
  - Use the global language selector in the `AppShell` header.
  - The selected locale is stored in the `vnexus_lang` cookie and in `localStorage`.
  - Subsequent narrative fetches and PDF download links automatically use the current locale.
- Case list and settings pages:
  - `/cases` localizes table headers, action labels, and empty states through the shared message dictionary.
  - Each case ID in `/cases` links to `/cases/:caseId`, where the event timeline can be reviewed against structured event data.
  - `/settings` lets users update language and theme preferences in one place.
  - Theme preference is stored in the `vnexus_theme` cookie and in `localStorage`.
  - When a signed-in user saves preferences, locale and theme are also persisted to the server-side profile record for cross-device consistency.
  - Case list data now comes from live case records and related report/document metadata instead of mock fixtures.
  - Case detail data now comes from persisted `EventAtom` records, and investigator/admin users can update event confirmation state from the timeline UI.
  - Because locale/theme are personal preference data, they should be handled under the same privacy review as other user profile fields.
- If `lang` is omitted, the server falls back to `Accept-Language` and then to English.
- Unsupported language values return `400 VALIDATION_ERROR`.

## Adding a New Language

1. Add the new locale code and translated message keys in `packages/shared/src/locale/messages.ts`.
2. Keep placeholder names stable, such as `{date}`, `{hospital}`, `{summary}`, and `{caseId}`.
3. Add any UI-specific keys used by `AppShell`, report pages, and narrative pages to the same shared dictionary.
4. Include any case list or settings UI keys in the same shared dictionary so locale switching stays global.
5. Reuse the shared dictionary from domain narrative builders and PDF builders instead of adding route-level text generation.
6. If the new language needs non-Latin glyphs in PDF output, embed a compatible font in `packages/domain/src/output/export/pdf-builder.ts`.
7. Update localization coverage in `pnpm test:epic6` and page-level coverage in `pnpm test:epic7`.

## Case Detail Timeline

- Use `/cases/:caseId` to inspect structured events that were derived from OCR extraction and event bundling.
- Consumers can read the timeline, while investigator/admin users can change the `confirmed` state of each event.
- Investigator/admin users can also edit event date, hospital, details, and review status from the case detail table.
- Confirmation updates are written back to the persisted event record through `/api/cases/:caseId/events/:eventId/confirmation`.
- Event edits are written through `/api/cases/:caseId/events/:eventId/edit`, and each edit appends a JSON history entry with editor, timestamp, and field-level changes.
- The UI uses optimistic updates, but failed saves roll back local state and surface the server error to the reviewer.
- Admin users can open edit history from the detail page to review prior changes.
- Timeline rows intentionally stay close to the evidence-oriented event structure; they are not free-form summaries.

## Analytics Dashboard

- Use `/cases/analytics` to review aggregate case and event metrics across the current workspace scope.
- Only investigator and admin roles can open the dashboard or call `/api/cases/analytics`.
- The dashboard exposes total cases, total events, confirmed/unconfirmed events, review-required events, events by type, and top hospital counts.
- The default dashboard view opens with the most recent 30 days applied as the initial date range.
- Use the filter panel to narrow results by ISO date range (`YYYY-MM-DD`), event type, and hospital.
- Trend data is available from `/api/cases/analytics/trend` and can be viewed in daily, weekly, or monthly intervals.
- The trend chart shows total, confirmed, and unconfirmed event counts over time so reviewers can spot backlog or quality shifts.
- Saved presets are available from `/api/cases/analytics/presets`, and each preset stores the current filter JSON plus the selected interval for the signed-in user.
- Presets can be shared with team members through `/api/cases/analytics/presets/share`; only active non-consumer users who share an organization with the preset owner can be selected.
- The share picker uses `/api/cases/analytics/presets/share/search?q=...` and only returns teammates from the same organization scope as the preset owner.
- Share search now supports paged loading with `page` so the UI can request more teammates without loading the full directory into memory.
- Share requests reject unknown emails, users outside the current organization boundary, and users without analytics-compatible roles.
- Shared presets are listed separately from personal presets through `/api/cases/analytics/presets/shared` so teams can reuse common analytics views without duplicating filters.
- Analytics exports are available from `/api/cases/analytics/export` in `csv` and `xlsx` formats, using the current filter and interval from the dashboard.
- Export files are generated from aggregated analytics and trend data, not raw OCR text or unrestricted case payloads, to keep the output aligned with the dashboard contract.
- Export requests are revalidated on the server against the requester's case access scope and against the event type / hospital values actually accessible to that user.
- Export generation now writes CSV/XLSX output to a temporary file and streams the response to the client, which reduces peak memory usage for larger analytics datasets.
- The dashboard shows export progress while the browser downloads the file, includes byte-level progress details when `Content-Length` is available, and lets the reviewer retry the most recent export request after a failure.
- Current safeguards keep export ranges to at most 366 days and limit explicit event type / hospital filters to 20 values each. If larger exports are needed later, move the flow to background jobs before expanding these limits.
- Analytics preset lookups now use database indexes plus a short-lived in-memory cache for owned/shared preset lists. Clear or replace this cache with Redis when deploying multiple web instances.
- Server-side analytics events are logged for preset sharing, search, export requests, export completion, export failures, cache hit/miss, and slow analytics operations. These logs avoid raw teammate search text and email values so PII does not leak into operational telemetry.
- An admin-only metrics snapshot is exposed through `/api/cases/analytics/metrics`, and Prometheus text output is available from `/api/cases/analytics/metrics?format=prometheus`.
- Optional analytics runtime settings can be supplied with `ANALYTICS_PRESET_CACHE_TTL_MS`, `ANALYTICS_EXPORT_MAX_DAYS`, `ANALYTICS_EXPORT_MAX_FILTER_VALUES`, `ANALYTICS_SLOW_QUERY_MS`, and `ANALYTICS_ALERT_WEBHOOK_URL`.
- The presets panel now includes a manual `Refresh presets` action so reviewers can bypass cache staleness after team activity.
- The dashboard also highlights top hospitals; selecting a hospital card drills the board into that hospital and refreshes the trend view.
- Aggregations are computed in the service/repository layer so route handlers remain thin and testable.
- Filter parsing and validation also happen before the service layer runs; invalid dates or unsupported intervals return `400 VALIDATION_ERROR`.
- If event or hospital categories become too large, the repository/service layer is the place to add normalization or caching.
