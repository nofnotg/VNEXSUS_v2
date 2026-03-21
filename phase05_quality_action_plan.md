# Phase 5 Quality Action Plan

## Executive Diagnosis
- Phase 4 broad rerun proved the timeout fix operationally: all 9 recoverable cases completed OCR, bundle persistence, structured output, narrative, and PDF generation without timeout recurrence.
- The remaining reason every case stayed `broad_partial_match` is not runtime failure anymore. The residual gap is semantic quality:
  - too many non-clinical or weakly relevant dates survive into the timeline
  - hospital names are not canonicalized tightly enough across aliases, spacing, departments, and address-heavy strings
  - dense cases still over-split bundles after noisy date candidates are accepted

## Why Operational Success Still Produced Partial Matches
1. The runtime now reaches the end of the pipeline consistently, so structural completeness is no longer the bottleneck.
2. The dominant mismatch pattern is `extra dates >> missing dates`, which means the engine is generating too much medically weak timeline material.
3. Institution matching is still fragile, especially when the OCR text mixes full hospital names, departments, transliteration variants, or clinic suffix variations.
4. In dense longitudinal cases, noisy dates create too many windows and too many event bundles, which preserves evidence but hurts semantic alignment.

## Top 3 Global Quality Problems By Leverage
1. **Date candidate noise and plausibility filtering**
   - symptoms: impossible years (`2925-05-19`), birth-like dates (`1957-04-19`), historical/reference dates flooding the timeline
   - representative cases: `Case17`, `Case10`, `Case12`, `Case36`
2. **Institution normalization and alias resolution**
   - symptoms: same hospital rendered as multiple aliases, address-heavy strings, department-only labels, mixed Hangul/English variants
   - representative cases: `Case2`, `Case16`, `Case34`, `Case36`
3. **Bundle over-segmentation after noisy windows**
   - symptoms: runtime stays structurally complete but dense cases explode into too many bundles with weak institution carry-forward
   - representative case: `Case20` (174 bundles from a single 47-page document)

## Top Case-Specific Exceptions
- `Case36`: highest-volume extra-date noise; use as the hardest global stress case after fixes.
- `Case20`: uniquely severe bundle count and empty runtime institution summary; likely the best case for bundle grouping diagnostics after date/institution fixes.
- `Case34`: medium-confidence baseline plus no coordinate reference support, so it should remain a cautious validation case even after normalization fixes.

## Recommended Smallest-First Quality Fix Sequence
1. **Date normalization and filtering first**
   - reject implausible years
   - separate demographic/birth/reference dates from encounter dates
   - rank clinically anchored dates above generic document dates
2. **Institution canonicalization second**
   - normalize spacing, Hangul/English alias variants, department suffixes, and address-heavy strings
   - add canonical hospital carry-forward into bundle/report stages
3. **Bundle grouping third**
   - reduce over-segmentation once date noise is lower
   - merge adjacent same-day bundles that share institution/evidence context
4. **Report/presentation tuning last**
   - only after date and institution quality improve should presentation-layer polish be re-evaluated

## Recommended Implementation Focus
- **Mixed sequencing, in this order:**
  1. `date normalization`
  2. `institution normalization / aliasing`
  3. `bundle grouping logic`
- `report assembly/presentation` should not be the next fix track, because current evidence shows the main defect is upstream semantic quality, not rendering.

## Phase 6 Decision
- **Phase 6 quality-fix implementation is justified next.**
- Reason:
  - the dominant blockers are now clear and repeat across multiple broad-rerun cases
  - another diagnosis pass would add little compared with a focused fix cycle
  - the highest-leverage order is concrete and testable against existing frozen artifacts

## Phase 6 Smallest-First Validation Recommendation
1. apply date-normalization fix
2. rerun `Case17` and `Case10`
3. apply institution canonicalization fix
4. rerun `Case2` and `Case34`
5. apply bundle-grouping fix
6. rerun `Case20`
7. finally recheck `Case36` as the combined stress case
