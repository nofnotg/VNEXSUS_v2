# Phase 2 Runtime Comparison Evidence

- targetBranch: `main`
- runtimeArtifactsCommit: `9d44a6b`
- comparisonArtifactsCommit: `524f4cf`
- remoteVerifiedAtCommit: `524f4cf`
- pushedCommitShas:
  - `9d44a6b`
  - `524f4cf`
- limitedRuntimeExecutionPerformed: `true`
- all10CasesCompared: `true`
- frozenPhase05ArtifactsModified: `false`
- frozenPhase01ArtifactsModified: `false`
- answerVsRepoMatched: `true`

## Final Selected Pilot10

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

## Medium-Confidence Cases

- `Case12`
- `Case16`
- `Case17`
- `Case20`
- `Case34`
- `Case36`

## Generated Runtime Files

- `phase02_runtime/Case2_runtime.json`
- `phase02_runtime/Case3_runtime.json`
- `phase02_runtime/Case7_runtime.json`
- `phase02_runtime/Case10_runtime.json`
- `phase02_runtime/Case12_runtime.json`
- `phase02_runtime/Case16_runtime.json`
- `phase02_runtime/Case17_runtime.json`
- `phase02_runtime/Case20_runtime.json`
- `phase02_runtime/Case34_runtime.json`
- `phase02_runtime/Case36_runtime.json`

## Generated Comparison Files

- `phase02_compare/Case2_compare.json`
- `phase02_compare/Case3_compare.json`
- `phase02_compare/Case7_compare.json`
- `phase02_compare/Case10_compare.json`
- `phase02_compare/Case12_compare.json`
- `phase02_compare/Case16_compare.json`
- `phase02_compare/Case17_compare.json`
- `phase02_compare/Case20_compare.json`
- `phase02_compare/Case34_compare.json`
- `phase02_compare/Case36_compare.json`

## Direct Remote Verification Checklist

- `phase02_runtime_manifest.json` raw fetch verified
- `phase02_compare_manifest.json` raw fetch verified
- `phase02_runtime/Case2_runtime.json` raw fetch verified
- `phase02_compare/Case2_compare.json` raw fetch verified
- frozen Phase 0.5 artifacts unchanged
- frozen Phase 1 artifacts unchanged

## Phase 2 Notes

- Runtime generation used a limited Phase 2 service-runner against the real local env, real DB, and real storage/OCR path.
- All 10 comparison artifacts were generated from frozen Phase 1 golden files and Phase 2 runtime outputs.
- Current dominant mismatch cause is runtime-side OCR failure caused by a missing Vision credential file path reference.
