# Phase 9 Fix Plan

## Exact files changed
- `packages/domain/src/dates/date-extraction.ts`
- `packages/domain/src/dates/date-extraction.test.ts`
- `packages/domain/src/entities/hospital-normalization.ts`
- `packages/domain/src/entities/entity-extraction.test.ts`
- `packages/domain/src/windows/date-centered-window.ts`
- `packages/domain/src/windows/date-centered-window.test.ts`
- `packages/domain/src/bundles/event-bundle-builder.ts`
- `packages/domain/src/bundles/event-bundle-builder.test.ts`

## Tracks implemented
- Track 1: date recall / precision balancing
- Track 2: institution carry-forward / alias cleanup
- Track 3: dense-case grouping refinement

## Why these files were chosen
- `date-extraction.ts` is the source of residual date noise and date recall imbalance.
- `hospital-normalization.ts` is the canonical hospital identity layer used downstream by extraction and grouping.
- `date-centered-window.ts` is where hospital carry-forward can be recovered when the local window is sparse.
- `event-bundle-builder.ts` is the tightest grouping layer for dense same-day evidence.
- The four test files were extended to pin the new date, hospital, window, and bundle rules with minimal local validation.

## What changed by track

### Track 1 — date recall / precision balancing
- Date typing now evaluates each date candidate with a local context window instead of judging the entire OCR block uniformly.
- Birth and metadata markers are rejected only when they are actually near the candidate.
- Clinically anchored dates inside mixed blocks are preserved instead of being dropped with nearby demographic noise.
- Metadata-heavy candidates without clinical anchors are filtered more aggressively.

### Track 2 — institution carry-forward / alias cleanup
- Hospital canonicalization now strips bracket noise, address-heavy prefixes, and generic legal prefixes before alias matching.
- Alias rules were tightened for the known hospital set used in the pilot corpus.
- Department-only labels are blocked from leaking into hospital identity.
- Date-centered windows now pull a nearby fallback hospital from adjacent page/block context when the local window is otherwise hospital-empty.

### Track 3 — dense-case grouping refinement
- Bundle grouping now uses alias-aware hospital keys instead of raw-string equality.
- Same-day soft atoms can join through a broader but bounded continuity rule when department/diagnosis/test/treatment context is shared.
- Canonical hospital representative selection is separated from raw hospital snapshot preservation.

## Residual risk after the fix
- Date ranking is improved, but high-pressure noisy cases may still surface low-value visit dates that require another scoring pass.
- Hospital canonicalization is conservative; new unseen aliases may remain unresolved until another alias rule is added.
- Dense-case grouping is less fragmented, but very long same-day chains can still require more evidence-aware merge tuning.

## Next focused validation cases
- Track 1: `Case3`, `Case10`, `Case36`
- Track 2: `Case16`, `Case2`, `Case34`
- Track 3: `Case20`

## Explicit track-to-case mapping
- Track 1 maps to `Case3`, `Case10`, `Case36`
- Track 2 maps to `Case16`, `Case2`, `Case34`
- Track 3 maps to `Case20`
