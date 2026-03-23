# Phase 2.5 Rerun Readiness Plan

## Scope

This document prepares a rerun-focused remediation step after Phase 2. It does not change frozen Phase 0.5 or Phase 1 artifacts, and it does not create any Phase 3 output.

## Current Comparison Limitation

Current Phase 2 comparison quality is limited because runtime generation did not succeed cleanly. The dominant result is runtime failure, so the current compare outputs mostly reflect execution breakdown rather than meaningful golden-vs-runtime semantic agreement.

## Dominant Runtime Failure Categories by Case

### OCR credential/config failure

- `Case2`
- `Case3`
- `Case10`
- `Case12`
- `Case16`
- `Case17`
- `Case20`
- `Case34`
- `Case36`

Observed signature:

- `runtime_error:Google Vision OCR request failed`
- `runtime_error_detail:ENOENT: no such file or directory, open 'C:\\VisionKeys\\medreport-assistant-2d733c1156cb.json'`

Interpretation:

- This is a global OCR runtime configuration failure, not a per-case semantic failure.

### Intake failure

- `Case7`

Observed signature:

- `runtime_error:File too large`

Interpretation:

- This is a case-specific intake constraint and should be remediated separately from the global OCR credential issue.

### Downstream semantic failure

- No dominant downstream semantic root cause can be trusted yet.
- `no_date_candidates` appears in the runtime outputs, but current OCR execution failed before a clean semantic run was established.

Interpretation:

- Semantic comparison must not be treated as authoritative until OCR execution is recovered.

## Global vs Case-Specific Failure Split

### Global failures

- Missing/incorrect Vision credential path referenced by the runtime environment
- OCR stage unavailable for 9 of 10 cases because the credential file path points to a non-existent file

### Case-specific failures

- `Case7` file-size intake failure

## Minimal Remediation Sequence Before Rerunning Phase 2

1. Fix the runtime OCR credential/config reference so the active environment points to the valid Vision key path.
2. Confirm the fixed runtime can complete at least one small pilot case through OCR blocks creation.
3. Re-check that the limited Phase 2 runner still uses the same frozen pilot10 selection and the same branch/SHA reporting discipline.
4. Decide how to handle `Case7`:
   - either split/compress to satisfy the intake limit, or
   - defer it and rerun the other 9 first with explicit documentation.
5. Rerun Phase 2 runtime generation before regenerating any compare outputs.
6. Replace current Phase 2 compare results only after a successful rerun generates clean runtime artifacts.

## Recommended Rerun Order

Run the smallest cases first to confirm the OCR fix before spending more budget.

1. `Case16`
2. `Case3`
3. `Case17`
4. `Case2`
5. `Case20`
6. `Case34`
7. `Case12`
8. `Case10`
9. `Case36`
10. `Case7` last, because it currently fails at intake

## Rerun Success Gate

Before considering Phase 2 rerun successful, confirm:

- at least one rerun case completes OCR without the credential-path error
- OCR blocks are persisted for that case
- compare output is based on real runtime extraction rather than execution failure placeholders
- the rerun still preserves frozen Phase 0.5 and Phase 1 artifacts unchanged
