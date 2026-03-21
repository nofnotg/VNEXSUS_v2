# Phase 2.5 Execution Evidence

- targetBranch: `main`
- configFixCommit: `0f653d3`
- rerunArtifactsCommit: `155827c`
- compareArtifactsCommit: `71ff42d`
- executionEvidenceCommit: `00092bb`
- remoteVerifiedAtCommit: `00092bb`
- pushedCommitShas:
  - `0f653d3`
  - `155827c`
  - `71ff42d`
  - `00092bb`

## Smoke test
- smokeTestCase: `Case16`
- ocrRecoveryProven: `true`
- smokeTestOutcome: `Case16 completed OCR, event bundles, structured output, investigator narrative, and investigator PDF without the prior ENOENT credential-path failure`

## Successful rerun cases
- `Case16`
- `Case3`

## Failed rerun cases
- `Case17` — semantic-stage transaction timeout after OCR blocks/date candidates/windows/atoms
- `Case2` — semantic-stage transaction timeout during event bundle update
- `Case20` — semantic-stage transaction timeout during event bundle create
- `Case34` — semantic-stage transaction timeout during event bundle create
- `Case12` — semantic-stage transaction timeout during event bundle update
- `Case10` — semantic-stage transaction timeout during event bundle update
- `Case36` — semantic-stage transaction timeout during event bundle create

## Deferred cases
- `Case7` — deferred due to upload limit conflict on `서울성모병원.pdf` (`25432858` bytes) against current `UPLOAD_MAX_FILE_SIZE_MB=20`

## Runtime recovery interpretation
- The original global OCR credential/config blocker was real and is now recovered for rerun execution by forcing `.env.local` override in the Phase 2.5 runner.
- Current remaining failures are not the original ENOENT credential-path failure.
- Current dominant rerun blocker after OCR recovery is semantic-stage Prisma transaction timeout in `event-bundle-service.ts`.

## Frozen artifact integrity
- Phase 0.5 frozen artifacts modified: `no`
- Phase 1 frozen artifacts modified: `no`
- Original Phase 2 artifacts preserved as historical evidence: `yes`

## Comparison coverage
- rerunRuntimeArtifactsGenerated: `9`
- rerunCompareArtifactsGenerated: `2`
- all10CasesCompared: `no`
- comparisonQuality: `execution-limited`

## Direct remote verification checklist
- [x] `phase02_5_runtime_manifest.json` exists on `main`
- [x] `phase02_5_compare_manifest.json` exists on `main`
- [x] `phase02_5_execution_evidence.md` exists on `main`
- [x] rerun runtime files for successful cases exist on `main`
- [x] rerun compare files for successful cases exist on `main`
- [x] no frozen Phase 0.5 or Phase 1 artifact changed
- [x] original Phase 2 artifacts still exist
- [x] no Phase 3 artifact created

## Answer/repo alignment
- answerVsRepoMatched: `true`
