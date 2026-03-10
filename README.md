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
- The dashboard also highlights top hospitals; selecting a hospital card drills the board into that hospital and refreshes the trend view.
- Aggregations are computed in the service/repository layer so route handlers remain thin and testable.
- Filter parsing and validation also happen before the service layer runs; invalid dates or unsupported intervals return `400 VALIDATION_ERROR`.
- If event or hospital categories become too large, the repository/service layer is the place to add normalization or caching.
