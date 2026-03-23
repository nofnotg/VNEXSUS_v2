# Phase13 Slice 2 File Plan

## Expected Touched Files

### `packages/shared/src/validation/contracts.ts`

- scope: shared
- why necessary:
  - if investigator report or narrative output needs to carry slice1 quality state explicitly, the shared validation contract is the narrowest place to declare that structure

### `packages/domain/src/output/renderers/investigator-report-renderer.ts`

- scope: domain
- why necessary:
  - slice2 is centered on preserving review and quality state into investigator report output

### `packages/domain/src/output/renderers/investigator-report-renderer.test.ts`

- scope: domain test
- why necessary:
  - provides direct proof that investigator report sections preserve the intended quality/review signals

### `packages/domain/src/output/narrative/investigator-narrative-builder.ts`

- scope: domain
- why necessary:
  - ensures narrative output stays aligned with the preserved review signals rather than flattening them away

### `packages/domain/src/output/narrative/investigator-narrative-builder.test.ts`

- scope: domain test
- why necessary:
  - proves that narrative output reflects the intended review state without widening scope

### `apps/web/lib/server/services/investigator-report-service.test.ts`

- scope: service test
- why necessary:
  - verifies that the investigator-facing service path still exposes the preserved report signals correctly

## Files That Must Remain Untouched

### Protected date-extraction files

- `packages/domain/src/dates/date-extraction.ts`
- `packages/domain/src/dates/date-extraction.test.ts`
- `apps/web/lib/server/services/date-extraction-service.ts`
- `apps/web/lib/server/services/date-extraction-service.test.ts`

Reason:

- these files carry validated protections for `Case10` and `Case36`
- slice2 is not an extraction retune

### Accepted slice1 files

- `packages/domain/src/bundles/event-bundle-builder.ts`
- `packages/domain/src/bundles/event-bundle-builder.test.ts`
- `packages/domain/src/output/investigator-slot-builder.ts`
- `packages/domain/src/output/investigator-slot-builder.test.ts`
- `apps/web/lib/server/services/event-bundle-service.ts`
- `apps/web/lib/server/services/event-bundle-service.test.ts`
- `phase13_slice1_definition.md`
- `phase13_slice1_verification_gate.md`
- `phase13_slice1_file_plan.md`
- `phase13_slice1_execution_notes.md`
- `phase13_slice1_verification_evidence.md`
- `phase13_slice1_acceptance_review.md`
- `phase13_slice1_pm_summary.md`

Reason:

- slice1 is already accepted and must not be reopened during slice2 definition or execution

### Frozen baseline and approval documents

- `validated_baseline_checkpoint.md`
- `phase13_pre_entry_approval_memo.md`
- `phase13_entry_plan.md`
- `phase13_execution_scope.md`
- `phase13_task_breakdown.md`

Reason:

- these documents define the approved entry and planning state and must stay stable

## Rollback Boundary

Rollback boundary for slice2 is limited to:

- investigator report contract adjustments
- investigator report renderer logic
- investigator narrative builder logic
- narrow service-level pass-through tests for investigator report output

If a change attempt crosses into extraction logic, accepted slice1 core files, consumer-output logic, schema changes, or productization work, it has crossed the slice2 rollback boundary and should be stopped rather than expanded.
