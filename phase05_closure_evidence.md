# Phase 0.5 closure evidence

- targetBranch: `main`
- phaseLockCommit: `241c1a2`
- evidenceCreateCommit: `302e9c8`
- evidenceSyncCommit: `d94a8f9`
- remoteVerifiedAtCommit: `d94a8f9`
- pushedCommitShas:
  - `241c1a2`
  - `302e9c8`
  - `d94a8f9`
- changedFiles:
  - `pilot10_manifest.json`
  - `pilot10_budget_plan.json`
  - `pilot10_mapping_review.json`
  - `phase05_closure_evidence.md`

## Direct remote verification checklist
- [x] Fetched `pilot10_manifest.json` from `main` via GitHub raw URL
- [x] Fetched `pilot10_mapping_review.json` from `main` via GitHub raw URL
- [x] Fetched `pilot10_budget_plan.json` from `main` via GitHub raw URL
- [x] Confirmed final selected cases are `Case2, Case3, Case7, Case10, Case12, Case16, Case17, Case20, Case34, Case36`
- [x] Confirmed `Case13` is no longer selected and is recorded as `finalDecision=replaced`, `replacedBy=Case2`
- [x] Confirmed `Case34` is kept with `manualConfirmed=true` and `hasCoordinateReference=false`
- [x] Confirmed `orderedExecutionPlan` now uses `Case2` instead of `Case13`
- [x] Queried GitHub remote tree and confirmed `CaseN_golden.json` count is `0`

## Final Case13 decision
- decision: `replace with Case2`
- rationale: `Case13` matched insurer/issue tokens but lacked strong direct patient linkage; `Case2` has stronger raw patient linkage and coordinate reference while using the same source document bundle more plausibly.

## Case34 rationale
- decision: `keep`
- rationale: coordinate reference is absent, but the raw patient token, the single Ilsan Hospital source document, and the report date range align strongly enough for a medium-confidence lock.

## Lock summary
- finalSelectedCount: `10`
- manualConfirmedTrueCount: `10`
- remainingMediumConfidenceCases:
  - `Case12`
  - `Case16`
  - `Case17`
  - `Case20`
  - `Case34`
  - `Case36`

## Remote-proof statement
- directFetchMatched: `true`
- searchVsFetchMismatchObserved: `false`
- answerVsRepoMatched: `true`
- note: `This file serves as the verification-note substitute because there is no PR/issue comment context in this workflow.`
