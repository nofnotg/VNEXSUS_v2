# Phase13 Slice 2 Definition

## Slice Name

Investigator review-signal propagation

## What Slice2 Is

Slice2 is a narrow investigator-output step that propagates the slice1 bundle quality and review signals from structured slot output into investigator-facing report and narrative outputs.

This slice is intended to ensure that:

- slice1 quality signals are not lost after the slot boundary
- investigator-facing outputs remain evidence-first and honest about weak bundle states
- later reviewers can see why a section still needs review without inferring it from flattened fields alone

## Why Slice2 Comes After Slice1

Slice2 comes after slice1 because slice1 created the bundle-to-slot evidence invariant gate. The next logical step is to make sure that the invariant is preserved in the next downstream layer instead of stopping at slot JSON.

Without slice2, the system has a stronger slot boundary but investigator report and narrative outputs can still flatten or hide part of that quality state.

## What Problem It Improves

Slice2 improves the reliability of investigator-facing outputs by making review state more explicit downstream.

The problem it targets is:

- slot bundles now know when a bundle is supported, review-required, or insufficient
- investigator report and narrative outputs do not yet use that structured signal as a first-class output element
- that creates avoidable ambiguity for human reviewers even though the core pipeline already knows the quality state

## Why It Is Still A Narrow Step

Slice2 is still narrow because it is limited to the investigator output path only.

It does not:

- reopen slice1
- retune date extraction
- touch the `Case10` or `Case36` protection logic
- attempt recall expansion for `Case3`
- broaden into consumer output, productization, or broader rerun work

## Exact Expected Outcome

At the end of slice2, the investigator output path should:

- preserve slice1 quality state into report-facing structures
- surface clear review cues in investigator report sections
- keep investigator narrative text aligned with the preserved review state
- make it easier to audit weak-evidence sections without reopening earlier pipeline logic
