# Phase13 Slice 1 File Plan

## Expected Touched Files

### `packages/shared/src/validation/contracts.ts`

- scope: shared
- why necessary:
  - defines the contract surface for invariant enforcement at the structured-output boundary
  - if slice1 adds explicit bundle/output validation signals, the shared contract is the right place to declare them

### `packages/domain/src/bundles/event-bundle-builder.ts`

- scope: domain
- why necessary:
  - bundle-level invariant enforcement should begin where provisional bundles are assembled
  - this is the narrowest domain point to preserve unresolved and review-required state before output mapping

### `packages/domain/src/bundles/event-bundle-builder.test.ts`

- scope: domain test
- why necessary:
  - slice1 needs direct proof that bundle invariants behave as intended

### `packages/domain/src/output/investigator-slot-builder.ts`

- scope: domain
- why necessary:
  - investigator slot output is the structured-output boundary that must not silently flatten weak bundle states

### `packages/domain/src/output/investigator-slot-builder.test.ts`

- scope: domain test
- why necessary:
  - slice1 needs direct proof that review-required and unresolved signals survive into structured output

### `apps/web/lib/server/services/event-bundle-service.ts`

- scope: service
- why necessary:
  - if invariant enforcement needs a service-layer handoff check before persistence/response use, this is the minimal service boundary to wire it

### `apps/web/lib/server/services/event-bundle-service.test.ts`

- scope: service test
- why necessary:
  - verifies that the service layer preserves the narrowed invariant contract without widening scope

## Files That Must Remain Untouched

### Date-protection files

- `packages/domain/src/dates/date-extraction.ts`
- `packages/domain/src/dates/date-extraction.test.ts`
- `apps/web/lib/server/services/date-extraction-service.ts`
- `apps/web/lib/server/services/date-extraction-service.test.ts`

Reason:

- these files carry the validated protections for `Case10` and `Case36`
- slice1 is intentionally not a date-extraction retune

### Watch / baseline documents

- `validated_baseline_checkpoint.md`
- `phase13_pre_entry_approval_memo.md`
- `phase13_entry_plan.md`
- `phase13_execution_scope.md`
- `phase13_task_breakdown.md`

Reason:

- these documents define the approved entry state and must remain stable while slice1 is executed

## Rollback Boundary

Rollback boundary for slice1 is limited to:

- bundle invariant logic
- structured output mapping logic
- direct service wiring for that invariant
- tests for those touched files

If a change attempt crosses into date extraction, wider event-bundle behavior redesign, schema changes, or baseline document rewrites, it has crossed the slice1 rollback boundary and should be stopped rather than expanded.
