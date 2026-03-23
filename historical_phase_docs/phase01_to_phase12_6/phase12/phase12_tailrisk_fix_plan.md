# Phase 12 Tail-Risk Fix Plan

## Files Changed
- `packages/domain/src/dates/date-extraction.ts`
- `packages/domain/src/dates/date-extraction.test.ts`

## Why These Files Were Chosen
- `date-extraction.ts` is the narrowest domain entry point for the remaining tail-risk date behavior.
- The three tail-risk cases (`Case3`, `Case10`, `Case36`) were all still dominated by date precision/recall problems, not institution or grouping failures.
- Keeping the change inside date extraction avoids reopening the already-frozen Track 2 / Track 3 paths.

## Diagnosed Low-End-Risk Mechanism
### `Case3`
- Clinically meaningful dates were still being lost when they appeared inside mixed OCR blocks that also contained metadata-like noise.
- The extraction logic was too sensitive to broad block-level metadata signals and not sensitive enough to nearby clinical date labels.

### `Case10`
- Non-clinical dates were still surviving from reservation / PID / read-timestamp style contexts.
- Compact clinical dates such as `YYYYMMDD` (`진료일자:20241023`) were being missed, which hurt recall while noisy metadata dates still leaked through.

### `Case36`
- High-pressure noisy documents still allowed too many admin/reference-style dates to survive.
- Repeated diagnosis/outpatient sections plus assurance/prescription-number style strings increased extra-date pressure.

## What Changed
### Date-ranking / filtering / recovery logic
- Added `YYYYMMDD` parsing so clinically labeled compact dates can be recovered.
- Expanded clinical date-label detection for:
  - `진료일자`
  - `진료기간`
  - `진료시작일`
  - `진료종료일`
  - `검사일`
  - `입원일`
  - `퇴원일`
  - `초진` / `재진` / `외래`
- Switched metadata-noise checks from broad block text to candidate-local context so mixed blocks do not poison true event dates unnecessarily.
- Added stronger local suppression for high-risk metadata markers such as:
  - `PID`
  - `Date:`
  - `Assurance`
  - `처방전교부번호`
  - `조합명칭`
  - `사업장기호`
  - `판독일시`
  - `작성일시`
  - `퇴원예정일`
  - `Care Plan`
- Tightened plan-date keeping so reservation-only dates are no longer kept as timeline candidates unless there is nearby clinical date-label support.
- Slightly widened local context radius so clinically labeled range endpoints and mixed-block dates have a better chance to survive ranking.

## Residual Risk After This Fix
- `Case3` may still remain partially recall-limited if some report-only dates are not recoverable from OCR/source evidence.
- `Case10` may still carry some clinically real but golden-extra dates because the source documents contain repeated true encounter activity.
- `Case36` may still be pressure-heavy because repeated same-date diagnosis sections can remain semantically dense even after metadata filtering.

## Next Tail-Risk-Only Focused Validation Cases
- `Case3`
- `Case10`
- `Case36`

## Fix Sub-Track to Target-Case Mapping
- compact-date recovery + local clinical label weighting
  - `Case3`
  - `Case10`
- stronger metadata / admin / reservation suppression
  - `Case10`
  - `Case36`
- candidate-local ranking instead of broad block poisoning
  - `Case3`
  - `Case36`
