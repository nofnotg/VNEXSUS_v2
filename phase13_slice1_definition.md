# Phase13 Slice 1 Definition

## Slice Name

Bundle-to-slot evidence invariant gate

## What The First Execution Slice Is

The first Phase13 execution slice is a narrow domain/service-centered hardening step that adds explicit invariant checks between provisional event bundles and structured investigator slot output.

This slice is intended to ensure that:

- event bundles passed forward into structured output preserve the evidence-first contract
- weak or incomplete bundle states are surfaced in a controlled way instead of silently degrading output quality
- the verified broader-rerun baseline is protected before any broader implementation work begins

## Why This Slice Should Come First

This slice should come first because it strengthens the core engine at the boundary where extracted medical events become structured output. That is the highest-leverage place to improve reliability without reopening the date-extraction changes that stabilized the current baseline.

It directly supports Phase13 priorities:

- evidence linkage integrity
- structured output reliability
- regression-safe execution from the verified baseline

## What Problem It Tries To Improve

The current baseline proves that the extraction core is stable enough to enter Phase13. The next risk is not that the baseline is unapproved, but that later implementation work could let incomplete or weakly supported bundles flow into structured slot output without a clear invariant gate.

This slice tries to improve:

- consistency between bundle-level evidence state and investigator slot output
- explicit handling of weak or review-required bundle states
- reliability of structured output before later Phase13 changes touch broader pipeline areas

## Why It Is The Safest First Move

This is the safest first move because it does not require reopening the validated date-ranking and suppression logic that protected the baseline.

In particular:

- it does not retune `packages/domain/src/dates/date-extraction.ts`
- it does not reopen the `Case10` repetitive inpatient log pruning path
- it does not reopen the `Case36` authored outpatient header suppression path
- it does not attempt recall expansion for `Case3`

Instead, it adds guardrails after extraction and bundling, where regression risk is easier to isolate and evaluate.

## Exact Expected Outcome

At the end of slice1, the codebase should have a clearly defined invariant layer that:

- rejects or flags bundle states that are too weak for structured investigator output
- preserves review-required and unresolved-slot signals when building output
- makes later Phase13 implementation less likely to erode the verified broader-rerun baseline silently

## Narrow-Slice Statement

This is a narrow execution slice, not broad implementation. It is limited to bundle/output invariant hardening and the minimal service wiring needed to preserve that contract.
