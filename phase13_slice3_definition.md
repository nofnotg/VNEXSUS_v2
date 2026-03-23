# Phase13 Slice 3 Definition

## Slice Name

Investigator evidence-anchor surfacing

## What Slice3 Is

Slice3 is a narrow investigator-output step that surfaces bundle evidence-anchor detail inside investigator-facing report and narrative outputs.

This slice is intended to ensure that:

- slice1 bundle quality gates remain evidence-first
- slice2 review-required signals are not the last visible quality layer
- investigator reviewers can see which evidence anchors are present or missing without inferring that from flattened entries alone

## Why Slice3 Comes After Slice2

Slice3 comes after slice2 because slice2 already preserved the coarse review-quality state into investigator-facing outputs.

The next logical narrow step is to expose the more specific evidence-anchor posture that explains why a section is supported, review-required, or insufficient.

Without slice3, investigator outputs know that review is needed, but they still hide too much of the anchor-level reason behind that status.

## What Problem It Improves

Slice3 improves investigator-side auditability and evidence linkage clarity.

The problem it targets is:

- slice1 already computes bundle quality gates with evidence anchors
- slice2 already preserves review-required and insufficient signals
- investigator-facing outputs still do not expose enough structured anchor detail to explain which evidence support is present or missing

That leaves avoidable ambiguity for reviewers who need to decide whether a weak section is missing diagnosis support, hospital support, test support, or other anchor types.

## Why It Is Still A Narrow Step

Slice3 is still narrow because it remains inside the investigator output path only.

It does not:

- reopen slice1
- reopen slice2 implementation logic outside small downstream extensions
- retune date extraction
- touch `Case10` or `Case36` protection logic
- attempt recall expansion for `Case3`
- broaden into consumer output, productization, export packaging, or broad refactoring

## Exact Expected Outcome

At the end of slice3, the investigator output path should:

- preserve evidence-anchor detail alongside existing bundle quality state
- make report sections explicitly show which anchor families are present or missing
- keep narrative review text aligned with that anchor-level evidence posture
- improve reviewer auditability without changing extraction or bundle-construction behavior
