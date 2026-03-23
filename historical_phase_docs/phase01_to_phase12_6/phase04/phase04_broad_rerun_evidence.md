# Phase 4 Broad Rerun Evidence

- targetBranch: `main`
- runtimeBroadRerunCommit: `5ee9c6e`
- compareBroadRerunCommit: `5ee9c6e`
- broadRerunEvidenceCommit: `2a7d7a6`
- evidenceSyncCommit: `fc651f8`
- remoteVerifiedCommit: `fc651f8`
- pushedCommitShas:
  - `5ee9c6e`
  - `2a7d7a6`
  - `fc651f8`
- attemptedCases:
  - `Case16`
  - `Case3`
  - `Case17`
  - `Case2`
  - `Case20`
  - `Case34`
  - `Case12`
  - `Case10`
  - `Case36`
- exactRerunOrderUsed:
  - `Case16`
  - `Case3`
  - `Case17`
  - `Case2`
  - `Case20`
  - `Case34`
  - `Case12`
  - `Case10`
  - `Case36`
- excludedCases:
  - `Case7: intake_limit_track_excluded_from_timeout_fix_validation`
- priorSemanticTimeoutSymptomRecurred: `false`
- timeoutFixEffectivenessStillHoldsAtBroadScale: `true`
- broadRerunCompleted: `true`
- broadRerunStoppedEarly: `false`
- frozenEarlierArtifactsModified: `false`
- answerVsRepoMatched: `true`

## Remote Verification Checklist
- [x] `phase04_runtime_manifest.json` fetched directly from `origin/main`
- [x] `phase04_compare_manifest.json` fetched directly from `origin/main`
- [x] `phase04_runtime/Case20_runtime_broad.json` fetched directly from `origin/main`
- [x] `phase04_compare/Case36_compare_broad.json` fetched directly from `origin/main`
- [x] No frozen earlier artifact changed in this rerun step
- [x] `Case7` remained excluded
- [x] No Phase 5 artifact exists

## Broad Rerun Summary
- attempted 9 recoverable pilot cases only
- all 9 completed runtime generation with event bundle persistence
- all 9 compared as `broad_partial_match`
- timeout recurrence was not observed at broad-rerun scale
- next decision: `Proceed to post-rerun quality diagnosis`
