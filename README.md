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
  - `/settings` lets users update language and theme preferences in one place.
  - Theme preference is stored in the `vnexus_theme` cookie and in `localStorage`.
  - When a signed-in user saves preferences, locale and theme are also persisted to the server-side profile record for cross-device consistency.
  - Case list data now comes from live case records and related report/document metadata instead of mock fixtures.
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
