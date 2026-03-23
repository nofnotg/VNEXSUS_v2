# Phase13 Slice 2 Verification Gate

## What Must Remain Protected

- the verified broader-rerun baseline
- the accepted slice1 bundle-to-slot invariant gate
- the protected date-extraction files
- the current watch/protection posture for `Case3`, `Case10`, and `Case36`

## Non-Regression Conditions

### Case3

- `Case3` must remain watch-only
- slice2 must not introduce any change that could be interpreted as recall expansion or blocker-grade worsening
- slice2 must not reopen extraction-side behavior

### Case10

- `Case10` must remain protected stable improved
- slice2 must not touch or indirectly reopen the path that previously reintroduced `2024-10-25` and `2024-10-30`
- slice2 must remain entirely outside date-ranking and inpatient repeat-pruning logic

### Case36

- `Case36` must remain protected cleared-blocker
- slice2 must not touch or indirectly reopen the authored outpatient header suppression path
- slice2 must remain entirely outside the date-extraction protection files

## Evidence Required Before Slice2 Can Be Accepted

- code diff stays within the approved slice2 file plan
- accepted slice1 artifacts remain unchanged
- protected date-extraction files remain untouched
- narrow tests exist for:
  - investigator report review-signal propagation
  - investigator narrative review-signal propagation
  - service-layer pass-through where needed
- slice2 execution notes and verification evidence exist in the repository
- no evidence suggests that slice2 widened into consumer-output or productization scope

## Stop Conditions

Stop slice2 and re-evaluate before merge if any of the following occurs:

- the change requires touching date-extraction protection files
- the change requires reopening slice1 files outside a tiny compatibility adjustment
- the change broadens from investigator output into consumer output or productization work
- the change requires schema or environment modification
- the change introduces uncertainty about the protected status of `Case10` or `Case36`
- the change makes `Case3` appear blocker-grade without new evidence
