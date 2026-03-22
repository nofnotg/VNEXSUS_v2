# Phase 12.6 Case36 Additional Fix Notes

1. Case36 surviving extra dates summary

- The remaining latest-baseline regression is driven by one new extra date family: `2025-08-06`.
- Phase 12.6 already removed several schedule/log noisy dates, but `2025-08-06` still survived and pushed the bundle count from baseline `95` to current `96`.
- The surviving source block is an outpatient authored-header style line: `외래 초진 작성 과 : 호흡기 내과 분과 ( 2025-08-06 )`.

2. Stage-level survival hypothesis

- `date candidate`: the parenthesized outpatient header date is still inferred as a `visit` candidate because it contains `외래` and `초진`.
- `window`: nearby blocks contribute strong surgery terms, so the weak header date inherits a medical window instead of dropping out.
- `event atom`: the inherited surgery context promotes the weak date into a `surgery` atom.
- `event bundle`: the atom survives as its own bundle, causing both one extra date and one extra bundle versus the locked baseline.

3. Suspected code path / function

- `packages/domain/src/dates/date-extraction.ts`
- Existing `hasOutpatientScheduleNoise(...)` handles timetable-style blocks but does not cover authored outpatient header lines.
- `shouldKeepDateCandidate(...)` currently allows this header date to survive as a `visit`.

4. Intended minimal fix

- Add one narrow guardrail for outpatient authored-header noise:
  - block contains an authored department header marker such as `외래 초진 작성 과` or `외래 경과 작성 과`
  - the date appears inside parentheses
  - no stronger clinical date label such as exam/surgery/admission/discharge/report labels is present locally
- Keep the suppression at date-candidate stage so the weak date never reaches atom/bundle formation.

5. Why Case10 should remain protected

- Case10's improvement came from document-local pruning for repetitive inpatient imaging logs.
- The Case10 signature is inpatient/NICU/repetitive-log specific and does not use outpatient authored-header phrases.
- This additional guardrail does not touch the earliest-seed pruning path that protected Case10.

6. Why Case3 is intentionally untouched

- Case3 remains primarily recall-limited because the missing dates are not reliably present as parseable persisted OCR/source blocks.
- Broad recall expansion is out of scope for this step and would add avoidable low-end risk.
- The new fix only removes a narrow outpatient header noise family and is intentionally not a recall change.
