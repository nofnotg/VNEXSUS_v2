# Phase13 Slice 1 Verification Gate

## Acceptance Checks Before Slice1 Can Be Accepted

- slice1 changes remain confined to the bundle/output invariant boundary and its direct service integration
- no broader rerun is triggered as part of slice1 execution
- no productization work is introduced
- no frozen earlier artifact or approved baseline document is modified

## Non-Regression Conditions

### Case3

- `Case3` must remain watch-only
- nothing in slice1 may reclassify `Case3` as blocker-grade without new evidence
- slice1 must not introduce date-extraction-side recall changes for `Case3`

### Case10

- `Case10` protected improved state must remain intact
- slice1 must not reopen the path that previously reintroduced `2024-10-25` and `2024-10-30`
- slice1 must not modify date ranking, inpatient repeat pruning, or related extractor behavior

### Case36

- `Case36` protected cleared-blocker state must remain intact
- slice1 must not reopen the path that previously allowed `2025-08-06` authored outpatient header noise to survive
- slice1 must not modify authored outpatient header suppression or related extractor behavior

## Evidence Required To Say Slice1 Did Not Erode The Verified Baseline

- code diff shows slice1 stayed within the planned bundle/output invariant files
- code diff shows date-extraction protection files remained untouched:
  - `packages/domain/src/dates/date-extraction.ts`
  - `packages/domain/src/dates/date-extraction.test.ts`
  - `apps/web/lib/server/services/date-extraction-service.ts`
  - `apps/web/lib/server/services/date-extraction-service.test.ts`
- targeted unit coverage exists for the touched invariant layer
- the touched tests demonstrate that unresolved/review-required bundle signals survive into structured output as intended
- slice1 documentation and commit history clearly preserve the current baseline assumptions:
  - `Case3` watch-only
  - `Case10` stable improved
  - `Case36` cleared blocker

## Stop Conditions

Stop slice1 and re-evaluate before merge if any of the following occurs:

- the change requires touching date-extraction logic to complete the slice
- the change requires a schema or environment change
- the change broadens into bundle engine refactoring beyond invariant enforcement
- the change makes `Case3` look blocker-grade without new evidence
- the change weakens the preserved protections for `Case10` or `Case36`
- the file plan can no longer stay narrow and reviewable
