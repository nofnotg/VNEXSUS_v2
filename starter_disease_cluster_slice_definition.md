# Starter Disease Cluster Slice Definition

## What This Slice Is

This slice adds the first planner-facing disease-cluster overview to the Starter result.

The slice is limited to a simple cluster summary layer that sits on top of the already accepted Starter core result.

## Why It Comes Immediately After Starter Core

- Starter core already gives planners the base case header, document summary, timeline, and warning state.
- The next missing planner-facing value is a short grouped overview of what kind of medical issue families appear in the case.
- This gives planners faster field usability without widening into disclosure review, Pro analysis, or deep interpretation.

## Planner Problem It Solves

Planners can read the timeline, but they still have to mentally group events into a few practical medical buckets.

This slice solves that by surfacing a short overview for the main disease or event families that matter in field case handling:

- cancer
- heart
- brain / cerebrovascular
- surgery
- hospitalization
- chronic / other important findings

## Exact Cluster Groups In Scope

- `cancer`
- `heart`
- `brain_cerebrovascular`
- `surgery`
- `hospitalization`
- `chronic_or_other_important`

## Allowed Output Level

This slice is limited to:

- `present`
- `not_found`
- `review_needed`

For each cluster, the output may include only:

- a short planner-facing overview sentence
- related event ids
- one representative evidence reference, or a very small evidence list if the contract requires a list shape

## What This Slice Must Not Do

- no deep medical interpretation
- no final diagnosis claim
- no disclosure-review logic
- no Pro drill-down behavior
- no selective vision cross-check behavior
- no bundle/extraction retune

## Expected Outcome

After this slice is later implemented, Starter should be able to show a compact disease-group overview that:

- stays evidence-grounded
- allows `review_needed`
- does not flatten uncertainty into confident wording
- helps planners understand case shape faster without acting like a medical or insurance decision engine

## Narrow-Scope Statement

This is a narrow Starter overview slice only.

It is not:

- a deep analysis slice
- a disclosure-review slice
- a Pro feature slice
- a productization slice
