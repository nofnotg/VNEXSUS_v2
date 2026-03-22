# Phase 12.6 Tail-Risk Fix Plan

## Files Changed
- `packages/domain/src/dates/date-extraction.ts`
- `packages/domain/src/dates/date-extraction.test.ts`
- `apps/web/lib/server/services/date-extraction-service.ts`
- `apps/web/lib/server/services/date-extraction-service.test.ts`
- `phase12_6_tailrisk_fix_plan.md`

## Why These Files Were Chosen
- `packages/domain/src/dates/date-extraction.ts`
  - the Phase 12.5 regression was still rooted in date candidate acceptance, not in institution or bundle-only logic
  - this was the narrowest place to suppress `Case36`-style schedule noise and prune `Case10`-style repeat seeds without reopening Track 2 / Track 3
- `packages/domain/src/dates/date-extraction.test.ts`
  - added narrow regression guards for the two concrete tail-risk signatures confirmed from frozen OCR block evidence
- `apps/web/lib/server/services/date-extraction-service.ts`
  - switched persistence to the new document-local date extraction entry so the pruning logic actually applies to stored candidates
- `apps/web/lib/server/services/date-extraction-service.test.ts`
  - updated the service-level test fixture to validate the document-local extraction path with stable date behavior

## Diagnosed Low-End-Risk Mechanism
### `Case3`
- Phase 12.5 stayed unchanged because the missing older dates did not appear as recoverable parseable OCR block dates in the currently available source block set.
- Read-only OCR block inspection showed the persisted source material is dominated by late-2024 to 2025 hospital records, while the frozen missing set still includes older report-history dates such as `2019-11-22`, `2020-03-20`, `2021-09-02`, `2023-11-22`, `2024-08-22`, `2024-11-22`, and `2025-03-19`.
- Because those dates are not presently available as ordinary extractor inputs, Phase 12 ranking/filtering changes could not improve recall there.

### `Case10`
- The Phase 12 compact-date recovery reopened repeated inpatient diagnostic-log dates inside NICU progress/imaging pages.
- Read-only OCR block inspection confirmed the regressed extra dates came from the same narrow signature:
  - `진료 기간`
  - `병실 : NICU`
  - `[ 입원 ]`
  - `진료 일자 : YYYYMMDD`
  - `[ 검사 일시 ]`
  - `[ 판독 일시 ]`
- This allowed `2024-10-25` and `2024-10-30` to survive as additional event seeds after `2024-10-23` was correctly recovered.

### `Case36`
- The regression came from high-pressure outpatient schedule blocks being treated as clinically meaningful visit dates too permissively.
- Read-only OCR block inspection confirmed the noisy signature:
  - bracketed date header like `[ YYYY-MM-DD ]`
  - `공단`
  - `초진` or `재진`
  - paired time range such as `11:37/11:39`
  - `Progress` / `ORDER LIST` / `Dr.`
- This reopened dates such as `2023-10-20`, `2024-04-22`, `2025-05-21`, `2025-05-28`, and `2025-06-04`.

## What Date-Ranking / Filtering / Recovery Logic Changed
- Added narrow block-level suppression for `Case36`-style outpatient schedule noise:
  - only applies to `visit` candidates
  - requires the combined `공단 + 초진/재진 + paired time range + Progress/ORDER LIST/Dr.` signature
  - avoids reopening the broader metadata deletion logic from Phase 12
- Added document-local pruning for `Case10`-style repetitive inpatient diagnostic logs:
  - detects the repeated `진료 기간 + 병실 + NICU + 입원 + 진료 일자 + 검사 일시 + 판독 일시` signature
  - groups those candidates by source file and clinical period
  - keeps only the earliest recovered seed date in that narrow repetitive series
- Preserved the existing compact clinical date recovery path so `Case10` does not simply fall back to the pre-Phase-12 miss state
- Left `Case3` broad recall gates unchanged because the confirmed issue there is currently source-availability-limited, not a newly introduced ranking defect

## Residual Risk After This Fix
- `Case3`
  - older report-history dates may still remain missing until a later step confirms an evidence-backed recovery path outside the currently parseable OCR block surface
- `Case10`
  - other older extra dates from the locked baseline remain outside this narrow regression fix
  - if another inpatient document uses the same signature for a clinically important later seed, the earliest-only pruning could still be conservative
- `Case36`
  - some non-bracketed outpatient repeats may still survive if they do not match the exact high-pressure schedule signature used here

## Next Tail-Risk-Only Focused Validation Cases
- `Case3`
- `Case10`
- `Case36`

## Fix Sub-Track to Target-Case Mapping
- outpatient schedule noise suppression
  - `Case36`
- repetitive inpatient diagnostic-log pruning
  - `Case10`
- recall preservation while avoiding broader date deletion
  - `Case3`
  - `Case10`
