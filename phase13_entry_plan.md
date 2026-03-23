# Phase13 Entry Plan

## Purpose

Phase13 begins from the verified broader-rerun baseline and focuses on controlled next-stage execution planning around the date-event extraction core, evidence linkage quality, and regression-safe delivery sequencing.

## Why Phase13 Is Allowed To Start Now

Phase13 entry is allowed because the current remote-verified baseline on `codex/phase12-6-tailrisk-date-fix` established all of the following:

- broader rerun is completed and remote-verified
- `anyRegression=false`
- no blocker-grade tail-risk remains at entry
- `Case3` is watch-only, not blocker-grade
- `Case10` is stable improved
- `Case36` is prior blocker cleared

## Approved Baseline

- approved branch baseline: `codex/phase12-6-tailrisk-date-fix`
- approved checkpoint: `validated_baseline_checkpoint.md`
- approval memo: `phase13_pre_entry_approval_memo.md`
- verified rerun basis:
  - `broader_rerun_manifest.json`
  - `broader_rerun_evidence.md`

Phase13 starts from this verified broader-rerun baseline. It does not reopen baseline approval.

## Guardrails Carried Into Phase13

- preserve frozen earlier artifacts and prior validation history exactly as-is
- treat the broader rerun as the official starting baseline, not as pending work
- do not silently erode the verified entry conditions
- protect evidence linkage and date-event extraction quality before any secondary work
- keep routes thin and business logic in domain and service layers
- do not treat `insuranceJoinDate` as OCR-derived data
- do not confirm core medical events without evidence

## Explicit Watch / Protection Notes

- `Case3`
  - remains watch-only
  - must be monitored during later work for missing-date sensitivity
  - must not be reclassified as blocker without new evidence
- `Case10`
  - protected improved state must be preserved
  - repeated later seeds `2024-10-25` and `2024-10-30` must not reappear
- `Case36`
  - cleared blocker state must be preserved
  - prior blocker date `2025-08-06` must not reappear

## Planning Posture For Phase13

Phase13 should start with controlled, regression-aware execution framing first. The first work should reduce risk in the core extraction/evidence pipeline before any broader extension work.

## Productization Scope Note

Productization remains out of scope unless separately authorized. This Phase13 entry package authorizes planning and controlled execution framing only.
