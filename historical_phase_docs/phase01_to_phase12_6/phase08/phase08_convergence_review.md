# Phase 8 Convergence Review

## Executive Diagnosis
- The recoverable set is now operationally stable. Across all 9 recoverable cases, the timeout-like runtime failure has stayed absent since the Phase 3 transaction-scope fix and the later post-fix validations.
- The remaining problem is no longer execution failure. It is residual semantic quality drift.
- The Phase 6 fixes generalized well enough to move the system out of blocker-class runtime risk, but they did not yet shrink all semantic gaps into uniformly minor debt.

## What Is Truly Solved vs What Is Only Improved
### Truly solved
- Timeout-like runtime instability
- OCR/runtime completion through bundle persistence, structured output, narrative, and PDF on the recoverable set
- The broad direction of all three fix tracks:
  - date normalization improved
  - institution normalization improved
  - bundle grouping improved

### Improved but not fully solved
- date precision/recall balance in high-noise cases
- canonical hospital identity carry-forward in multi-source or alias-heavy cases
- dense-case bundle convergence where noisy dates still leak into grouping

## Top 3 Residual Global Quality Gaps
1. **Residual date noise**
   - still visible in `Case10`, `Case12`, `Case17`, and especially `Case36`
   - extra dates are materially lower than Phase 4, but not yet uniformly minor
2. **Residual institution canonicalization / alias drift**
   - still visible in `Case2`, `Case16`, `Case34`, and `Case36`
   - better than Phase 4, but canonical hospital naming is not yet fully stable
3. **Residual date recall gaps**
   - most visible in `Case3`, with supporting traces in `Case10`, `Case16`, and `Case36`
   - these are smaller than the original blocker class, but still large enough to affect timeline trust

## Important Case-Specific Exceptions
- `Case36`
  - still the highest-pressure residual stress case
  - improvement is real, but the remaining extra-date volume is too large for final stabilization confidence
- `Case3`
  - strongest remaining date-recall problem
  - the system is better than Phase 4, but still misses too many golden dates for acceptance-level confidence
- `Case20`
  - grouping is dramatically better than the Phase 4 bundle explosion
  - however it remains the clearest dense-case grouping exception and should stay in the next fix-validation loop
- `Case34`
  - remains useful as a cautionary case because of medium-confidence frozen baseline and residual date noise

## Convergence Sufficiency for Stabilization Review
- The recoverable set has **meaningfully converged**, but not enough for final stabilization / acceptance review yet.
- Evidence for this conclusion:
  - no runtime instability remains
  - all nine cases improved versus Phase 4
  - but convergence is:
    - `strong_convergence`: 0
    - `moderate_convergence`: 5
    - `weak_convergence`: 4
- A final stabilization review would still be forced to treat several residual quality issues as open blockers rather than acceptable debt.

## Would Another Quality-Fix Cycle Still Have Meaningful ROI?
- **Yes.**
- Another targeted quality-fix cycle should still pay off because the remaining gaps are now concentrated and well-understood:
  1. one more date-noise reduction pass
  2. one more hospital canonicalization pass
  3. one dense-case grouping refinement pass

## Explicit Recommendation for the Next Stage
- **Another targeted quality-fix cycle is needed before stabilization.**
- Recommended smallest-first sequence:
  1. date recall/precision balancing on `Case3`, `Case10`, `Case36`
  2. institution carry-forward and alias cleanup on `Case16`, `Case2`, `Case34`
  3. dense-case grouping refinement on `Case20`

## Why `Case7` Remains Outside This Review
- `Case7` is still an intake-limit track, not a recoverable semantic-quality case.
- Its unresolved problem is upload-size handling rather than post-fix semantic convergence, so including it here would mix two different defect classes.
