# Phase 3 Fix Plan

## Exact files changed

- `apps/web/lib/server/services/event-bundle-service.ts`

## Why this file was chosen

Phase 2.6 identified `event-bundle-service.ts` as the highest-leverage defect site. The seven rerun-failed cases all reached OCR blocks, date candidates, windows, and atoms, then failed while persisting bundles or linking atoms inside the same Prisma interactive transaction.

This file is therefore the narrowest code location that can address the dominant timeout cluster without touching frozen evidence artifacts or pulling `Case7` into the same track.

## What timeout/transaction pattern was changed

Previous pattern:
- one interactive transaction per case
- `eventBundle.deleteMany`
- large `Promise.all(eventBundle.create(...))`
- per-atom `eventAtom.update(...)` loop

This made bundle persistence hold a long transaction open across many creates and follow-up updates, which matches the observed `Transaction already closed` / `Transaction not found` failures in Phase 2.5.

New pattern:
- keep the reset transaction tiny:
  - `eventAtom.updateMany(... eventBundleId: null)`
  - `eventBundle.deleteMany(...)`
- then persist each bundle in a bounded transaction:
  - one `eventBundle.create(...)`
  - one `eventAtom.updateMany(...)` for that bundle's atoms
- remove the large case-wide `Promise.all(...)` bundle write pattern
- replace per-atom update loop with `updateMany(...)` on the bundle atom set
- raise the per-bundle transaction timeout to `15000` ms instead of relying on the previous short default

## What risk remains after the fix

1. Large cases may still fail if a single bundle write is unusually large.
2. Partial semantic quality issues remain even when timeout is solved, as seen in `Case16` and `Case3` partial matches.
3. `Case7` remains outside this fix because its blocker is intake-size, not transaction timeout.

## What rerun should be used next to validate the fix

Use a **smallest-first limited rerun**, not a broad pilot rerun.

Recommended validation order:
1. `Case16` smoke rerun
2. `Case3`
3. one previously timeout-failed medium case such as `Case17` or `Case20`

The goal of the next rerun is only to confirm whether the semantic transaction-timeout cluster is materially reduced before expanding wider.
