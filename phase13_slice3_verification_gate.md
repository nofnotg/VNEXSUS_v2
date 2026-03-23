# Phase13 Slice 3 Verification Gate

## What Must Remain Protected

- the verified broader-rerun baseline
- the accepted slice1 bundle-to-slot invariant gate
- the accepted slice2 investigator review-signal propagation behavior
- the protected date-extraction files
- the current watch/protection posture for `Case3`, `Case10`, and `Case36`

## Non-Regression Conditions

### Case3

- `Case3` must remain watch-only
- slice3 must not introduce any change that looks like recall expansion or blocker-grade worsening
- slice3 must remain fully outside extraction-side behavior

### Case10

- `Case10` must remain protected stable improved
- slice3 must not touch or indirectly reopen the path that previously reintroduced `2024-10-25` and `2024-10-30`
- slice3 must remain entirely outside date-ranking and inpatient repeat-pruning logic

### Case36

- `Case36` must remain protected cleared-blocker
- slice3 must not touch or indirectly reopen the authored outpatient header suppression path
- slice3 must remain entirely outside the protected date-extraction files

## Evidence Required Before Slice3 Can Be Accepted

- code diff stays within the approved slice3 file plan
- accepted slice1 artifacts remain unchanged
- accepted slice2 artifacts remain unchanged in principle
- protected date-extraction files remain untouched
- narrow tests exist for:
  - investigator report evidence-anchor surfacing
  - investigator narrative evidence-anchor surfacing
  - service-layer exposure of anchor-level review detail where needed
- slice3 execution notes and verification evidence exist in the repository
- no evidence suggests that slice3 widened into consumer-output, export, or productization scope

## Stop Conditions

Stop slice3 and re-evaluate before implementation if any of the following occurs:

- the change requires touching protected date-extraction files
- the change requires reopening accepted slice1 files
- the change requires reopening accepted slice2 behavior outside a tiny downstream compatibility extension
- the change broadens from investigator output into consumer output, export packaging, or productization work
- the change requires schema or environment modification
- the change introduces uncertainty about the protected status of `Case10` or `Case36`
- the change makes `Case3` appear blocker-grade without new evidence
