# Phase13 Execution Scope

## In Scope

- controlled Phase13 execution planning grounded in the verified broader-rerun baseline
- core pipeline work that directly supports:
  - date-event extraction quality
  - evidence linkage integrity
  - structured output reliability
  - regression-safe stabilization of the validated baseline
- narrowly scoped implementation planning that can be executed without reopening prior validation or baseline contracts
- regression protection checks tied to `Case3`, `Case10`, and `Case36`

## Out Of Scope

- productization
- pricing, packaging, or release preparation
- a new tail-risk fix cycle unless new evidence requires it later
- a new broader rerun unless separately triggered by later work
- unrelated refactors
- schema or environment changes not required by future Phase13 execution work
- rewriting historical validation or checkpoint documents

## What Must Remain Frozen

- all frozen earlier artifacts through the approved Phase12.6 baseline
- all historical validation and rerun artifacts
- all approved baseline and approval documents
- all prior evidence files that define the current verified entry state

## What Must Be Protected From Regression

- broader rerun baseline condition:
  - `anyRegression=false`
  - no blocker-grade tail-risk at entry
- evidence-first event confirmation contract
- date-event extraction quality in the validated baseline
- runtime behavior that produced the approved broader-rerun checkpoint

## Explicit Preservation Notes

- `Case10` stable improved must not be degraded
  - repeated later seeds `2024-10-25` and `2024-10-30` must remain absent unless new evidence proves otherwise
- `Case36` cleared blocker must not reappear
  - `2025-08-06` authored outpatient header noise must remain suppressed
- `Case3` must remain monitored as watch-only
  - its missing-date sensitivity must be tracked during later work
  - it must not be treated as blocker-grade without new evidence

## Operational Rules For Phase13 Work

- start from the verified broader-rerun baseline every time planning or execution decisions are made
- prefer smaller, reviewable steps over broad changes
- if future work changes extraction behavior, it must explicitly check that `Case10` and `Case36` protections still hold
- if future work worsens `Case3`, pause and re-evaluate before continuing
- do not expand scope into productization without separate authorization
