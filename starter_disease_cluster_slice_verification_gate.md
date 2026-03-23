# Starter Disease Cluster Slice Verification Gate

## What Must Remain Protected

- the accepted Starter core slice
- protected date-extraction files
- current honest review-needed and unresolved signaling
- evidence-first behavior
- non-judgment wording discipline

## Non-Regression Conditions

### Starter Core Slice

- case basic info must continue to assemble unchanged in behavior
- document inventory summary must continue to assemble unchanged in behavior
- medical event timeline must remain visible and evidence-linked
- warning and review summary must remain visible and honest

### Protected Date-Extraction Files

The following files must remain untouched:

- `packages/domain/src/dates/date-extraction.ts`
- `packages/domain/src/dates/date-extraction.test.ts`
- `apps/web/lib/server/services/date-extraction-service.ts`
- `apps/web/lib/server/services/date-extraction-service.test.ts`

### Honest Review-Needed Behavior

- disease clusters must be allowed to return `review_needed`
- weak or mixed evidence must not be rewritten as `present`
- missing cluster support must not be hidden behind over-clean wording
- representative evidence references must stay traceable

## Evidence Required Before Later Acceptance

Before this slice can later be accepted, the repository must show:

- a disease-cluster contract or compatible extension to the Starter contract
- a narrow builder or assembler for Starter disease clusters
- focused tests for:
  - cluster classification shape
  - `review_needed` preservation
  - representative evidence propagation
  - Starter core non-regression at the assembly boundary
- implementation evidence that no disclosure-review, Pro, or extraction scope was opened

## Stop Conditions

Stop the slice if implementation requires:

- modifying protected date-extraction files
- adding disclosure-review logic
- adding Pro behavior or question/search behavior
- adding deep medical interpretation language
- changing Starter core semantics beyond narrow compatibility updates
- widening into billing, auth, social login, or productization work

## Acceptance Lens

This slice should only be accepted later if it remains a simple planner-facing overview layer and does not convert uncertainty into medical or insurance conclusions.
