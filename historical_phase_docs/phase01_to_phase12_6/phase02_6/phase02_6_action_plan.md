# Phase 2.6 Action Plan

## Executive diagnosis

Phase 2.5 proved that the original OCR credential-path failure is no longer the dominant blocker. The system can now complete a real rerun for at least two pilot cases (`Case16`, `Case3`), which means the pipeline is no longer blocked at the environment/OCR entry point.

The remaining dominant failure is not OCR configuration. It is a downstream write-path failure in `event-bundle-service.ts`, where Prisma interactive transactions time out or close before event bundle writes finish. `Case7` is separate and remains an intake-limit problem.

## Did Phase 2.5 prove runtime recovery sufficiently?

Yes. Phase 2.5 is sufficient to prove runtime recovery.

Why:
- `Case16` smoke test completed OCR, event bundles, structured output, narrative, and PDF.
- `Case3` also completed end-to-end rerun.
- the prior ENOENT credential-path failure did not recur.

This is enough to move the main diagnosis away from environment recovery and toward application/database write-path defects.

## What should happen next?

**Decision: Phase 3 fix implementation next**

Another blind rerun is not the best next step. The remaining failures are now concrete and repetitive enough that additional reruns without code changes are unlikely to teach us more.

## Top 3 root problems by leverage

1. **Event bundle transaction timeout**
   - Seven rerun-failed cases now cluster around the same downstream Prisma transaction timeout/closed-transaction failure.
   - This is the highest-leverage fix because it blocks most of the remaining pilot set.

2. **Semantic completeness gap even on recovered cases**
   - `Case16` and `Case3` are only partial matches.
   - The pipeline now runs, but date coverage and institution normalization are still incomplete or noisy.

3. **Oversized PDF intake handling**
   - `Case7` never entered the recovered runtime path because of the current upload-size limit.
   - This is a distinct intake product/engineering gap, not part of the semantic timeout cluster.

## Recommended execution sequence

1. Fix the Prisma/event-bundle transaction handling in the downstream semantic write path.
2. Rerun the seven semantic-timeout cases after that fix.
3. Re-evaluate partial-match quality on `Case16` and `Case3` once the wider rerun succeeds.
4. Address `Case7` intake handling separately with a preprocessing or oversized-file path.

## Recommended smallest-first fix order

1. `event-bundle-service.ts`
   - reduce interactive transaction scope
   - avoid long `Promise.all` writes inside the same interactive transaction
   - split create/update work into smaller bounded operations

2. bundle write-path callers / transaction boundary
   - confirm whether upstream semantic stages should persist before bundle assembly
   - prevent already-computed OCR/date/window/atom work from being lost when bundle write fails

3. intake oversized-file handling for `Case7`
   - split/compress/preprocess path
   - or dedicated async large-file intake route

## Explicit Case7 decision

`Case7` should stay outside the semantic-timeout repair track.

Recommended handling:
- do **not** rerun it unchanged
- implement or design an oversized-PDF intake path first
- only then return it to the pilot rerun queue

## Is Phase 3 implementation justified now?

Yes.

Phase 3 implementation is justified now because:
- the dominant blocker is clear
- it is repeated across multiple cases
- additional reruns without code change are unlikely to improve understanding
- the next fix sequence is concrete and high leverage
