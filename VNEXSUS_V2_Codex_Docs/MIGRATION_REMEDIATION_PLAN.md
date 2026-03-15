# Migration Remediation Plan

## Scope

This note separates temporary field fixes used to unblock real pipeline verification from the long-term migration history strategy.
It is intentionally forward-looking: no additional edits to historical migration files are recommended from this point.

## 0001_baseline

- Current status: temporary field patch
- Why it is temporary:
  - The file was edited to remove a BOM so remote deployment could proceed.
  - Editing the baseline after environments have already applied or recorded it weakens migration-history reproducibility.
- Why squash or baseline reorganization is recommended:
  - New environments should start from a clean, deterministic baseline rather than inheriting a retroactively edited first migration.
  - A rebuilt baseline reduces ambiguity about which exact file content represents the canonical starting point.
- Reproducibility risk:
  - Teams or CI jobs that rebuild from scratch can see different outcomes depending on whether they start from the original migration history or the patched copy.
- Follow-up action:
  - Create a documented squash or replacement baseline plan and use that baseline for future fresh environments.

## 0008_provisional_event_atoms

- Current status: temporary field patch
- Why direct historical edit is risky:
  - The file was edited to cast `canonicalDate` so deployment could finish, but the migration already belongs to established history.
  - Keeping the history edit as the default path makes it harder to reason about drift between existing databases and fresh rebuilds.
- Why a forward-only corrective migration is safer:
  - A new migration can explicitly normalize the target column type and data conversion without rewriting history.
  - Existing environments keep an auditable, append-only change record.
- What the corrective migration should address:
  - Re-assert the intended `canonicalDate` type contract.
  - Apply any needed cast or backfill explicitly against the current schema state.
- Follow-up action:
  - Add a new corrective migration after the current head, scoped only to the `canonicalDate` compatibility fix.

## Related Files Kept Out Of Commit A

- `prisma/schema.prisma`
  - Keep out of the PDF/TIFF async-batch commit so schema/runtime contract changes stay separate from OCR behavior changes.
- `apps/web/lib/session.ts`
  - Keep out of the PDF/TIFF async-batch commit so auth/session hardening stays isolated from OCR behavior changes.
- `.codex/config.toml`
  - Local operator configuration, not part of the product behavior change.

## Commit Strategy

- Commit A:
  - PDF/TIFF async-batch OCR split and PDF export stabilization only.
- Commit B:
  - Migration/session/schema cleanup after the migration remediation strategy is approved and converted into forward-safe changes.
