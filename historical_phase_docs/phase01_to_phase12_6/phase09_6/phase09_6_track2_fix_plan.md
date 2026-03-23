# Phase 9.6 Track 2 Institution Targeted Fix Plan

## Files changed
- `packages/domain/src/entities/hospital-normalization.ts`
- `packages/domain/src/windows/date-centered-window.ts`
- `packages/domain/src/bundles/event-bundle-builder.ts`
- `packages/domain/src/entities/hospital-normalization.test.ts`
- `packages/domain/src/entities/entity-extraction.test.ts`
- `packages/domain/src/windows/date-centered-window.test.ts`
- `packages/domain/src/bundles/event-bundle-builder.test.ts`

## Why these files were chosen
- `hospital-normalization.ts`
  - Track 2 regression source was primarily alias-family divergence and canonical-name drift.
  - This is the narrowest place to repair `Case2` without reopening date or bundle-wide logic.
- `date-centered-window.ts`
  - Frozen Phase 9.5 evidence showed canonical hospitals were not staying collapsed consistently once window summaries were built.
  - Window-level summary collapse is required so downstream atoms/bundles inherit one institution family instead of raw variants.
- `event-bundle-builder.ts`
  - `Case16` and `Case34` showed downstream carry-forward drift even when extraction recovered the right institution family nearby.
  - Bundle-level representative selection needed the same alias-family collapse to avoid preserving generic or duplicate hospital variants.

## Diagnosed regression mechanism in Case2
- `Case2` regressed because one hospital family split into multiple downstream identities:
  - Korean form with suffix
  - English alias form
  - shorter raw alias form
- The frozen Phase 9.5 compare file showed:
  - fewer missing institutions than the previous locked baseline
  - but new extra institutions appeared (`...의원`, `SMRADIOLOGYCLINIC`)
  - therefore comparison got worse even though timeout/runtime health stayed good
- Root cause:
  - alias normalization was too conservative for the `SM radiology` family
  - downstream summary/bundle stages preserved family variants instead of collapsing them to one representative canonical identity

## Why Case16 and Case34 were used as comparison references
- `Case16`
  - remained unchanged, showing a downstream carry-forward drift case where `일산차병원` and `차병원` both survived
  - useful to verify that a generic short alias should collapse into the specific institution family
- `Case34`
  - improved but still carried a prefixed institution form (`국민건강보험 ... 일산병원`) that drifted from the shorter clinical identity
  - useful to keep canonicalization conservative while removing address/legal-prefix noise

## What changed
### Alias normalization
- Added tighter alias-family handling for:
  - `SM Radiology Clinic`
  - `SM 영상의학과`
  - `에스엠영상의학과`
  - `...의원` suffix variants
- These now collapse to one canonical institution family:
  - `에스엠영상의학과`

### Canonicalization / suppression
- Adjusted `국민건강보험(공단) 일산병원` family to canonicalize to:
  - `일산병원`
- Added explicit alias-family handling for:
  - `차병원`
  - `일산차병원`
- This keeps the more specific hospital identity when both generic and specific variants appear together.

### Carry-forward refinement
- Added `collapseHospitalVariants(...)` and reused it in:
  - date-centered window summary finalization
  - bundle candidate snapshot summary
  - bundle representative hospital selection
- This prevents downstream phases from re-expanding the same hospital family into multiple competing labels after extraction already found the family.

## Residual risk after this fix
- `차병원` family collapse is intentionally narrow but still pilot-biased; it should be monitored in multi-branch CHA-family documents later.
- `일산병원` canonicalization now prefers the shorter clinical identity; this improves frozen comparison fit but should be watched for over-shortening in non-pilot corpora.
- This fix does not address Track 1 date noise or Track 3 dense bundle behavior.

## Next focused validation cases
- primary regression target:
  - `Case2`
- comparison references:
  - `Case16`
  - `Case34`

## Fix-track to target-case mapping
- Track 2 alias normalization:
  - `Case2`
- Track 2 canonicalization / suppression:
  - `Case34`
- Track 2 carry-forward refinement:
  - `Case16`
