# Phase 1 Golden Baseline Evidence

- targetBranch: `main`
- goldenArtifactsCommit: `11e4c4d`
- goldenEvidenceCommit: `6d21d98`
- remoteVerifiedAtCommit: `6d21d98`
- pushedCommitShas:
  - `11e4c4d`
  - `6d21d98`

## Generated files
- `phase01_golden/Case2_golden.json`
- `phase01_golden/Case3_golden.json`
- `phase01_golden/Case7_golden.json`
- `phase01_golden/Case10_golden.json`
- `phase01_golden/Case12_golden.json`
- `phase01_golden/Case16_golden.json`
- `phase01_golden/Case17_golden.json`
- `phase01_golden/Case20_golden.json`
- `phase01_golden/Case34_golden.json`
- `phase01_golden/Case36_golden.json`
- `phase01_golden_manifest.json`

## Direct remote verification checklist
- [x] `phase01_golden_manifest.json` was fetched from `main` via raw GitHub URL.
- [x] `phase01_golden/Case2_golden.json` was fetched from `main` via raw GitHub URL.
- [x] GitHub tree API shows exactly 10 `phase01_golden/*_golden.json` files on `main`.
- [x] Frozen pilot10 set in remote manifest is unchanged:
  - `Case2`
  - `Case3`
  - `Case7`
  - `Case10`
  - `Case12`
  - `Case16`
  - `Case17`
  - `Case20`
  - `Case34`
  - `Case36`

## Frozen pilot10 and caution list
- finalSelectedCases:
  - `Case2`
  - `Case3`
  - `Case7`
  - `Case10`
  - `Case12`
  - `Case16`
  - `Case17`
  - `Case20`
  - `Case34`
  - `Case36`
- mediumConfidenceCases:
  - `Case12`
  - `Case16`
  - `Case17`
  - `Case20`
  - `Case34`
  - `Case36`

## Phase boundary confirmation
- Phase 0.5 frozen artifacts modified in Phase 1: `none`
- Phase 1 scope in this step: `golden-baseline artifacts only`
- Phase 1 pipeline execution started: `no`
- Phase 2 artifacts created: `no`

## Answer-vs-repo match
- directFetchMatched: `true`
- answerVsRepoMatched: `true`
- notes: `Remote raw fetch and tree verification matched the local claim for all generated Phase 1 golden-baseline artifacts.`
