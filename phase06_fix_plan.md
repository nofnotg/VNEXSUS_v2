# Phase 6 Fix Plan

## Exact Files Changed
- `packages/domain/src/dates/date-extraction.ts`
- `packages/domain/src/dates/date-extraction.test.ts`
- `packages/domain/src/entities/hospital-normalization.ts`
- `packages/domain/src/entities/entity-extraction.ts`
- `packages/domain/src/entities/entity-extraction.test.ts`
- `packages/domain/src/windows/date-centered-window.ts`
- `packages/domain/src/windows/date-centered-window.test.ts`
- `packages/domain/src/bundles/event-bundle-builder.ts`
- `packages/domain/src/bundles/event-bundle-builder.test.ts`

## Tracks Implemented
- Track 1: date normalization / plausibility filtering
- Track 2: institution canonicalization / alias resolution
- Track 3: bundle grouping stabilization

## Why These Files Were Chosen
- `date-extraction.ts` is the first gate for false-positive dates and DOB-like noise.
- `entity-extraction.ts` and new `hospital-normalization.ts` control hospital-name normalization before windows, atoms, bundles, and reports inherit the values.
- `date-centered-window.ts` is where noisy date anchors can still become semantic windows even after extraction.
- `event-bundle-builder.ts` is the narrowest domain point for reducing same-day over-segmentation without touching route logic or frozen validation artifacts.

## What Changed

### Track 1 — Date normalization
- Added year plausibility filtering to reject impossible or implausible candidates.
- Added DOB / demographic keyword rejection so birth-like dates are not promoted into event candidates.
- Added clinical-anchor gating so generic visit dates without nearby medical context are dropped earlier.
- Updated window aggregation to skip `plan` dates and context-free windows with no clinical entities.

### Track 2 — Institution normalization
- Added canonical hospital alias handling for known problematic variants.
- Added department-only suppression so strings like `암센터` are not promoted as hospitals.
- Normalized hospital values again during window aggregation so downstream summaries inherit canonical names more consistently.

### Track 3 — Bundle grouping
- Changed bundle join logic to compare against the bundle tail instead of only the first atom.
- Added alias-key hospital comparison instead of strict raw-string equality.
- Allowed same-day soft clinical atom types to join when file/page/block proximity and hospital context align.
- Kept hard-separate types (`surgery`, `procedure`, `admission`, `discharge`, `mixed`, `unknown`) isolated.

## Remaining Risk
- Plausibility filtering may still keep some clinically irrelevant dates if they share medical keywords in the same block.
- Alias rules are still case-driven and not yet a full hospital vocabulary.
- Bundle grouping is safer than before, but dense same-day cases can still need more evidence-aware grouping beyond file/page/block proximity.

## Next Focused Validation Cases
- Track 1: `Case17`, `Case10`
- Track 2: `Case2`, `Case34`
- Track 3: `Case20`
