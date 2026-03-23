# Phase13 Task Breakdown

## Task 1

- goal: lock the execution starting point to the verified broader-rerun baseline
- why it matters: all later work must inherit the same approved entry conditions and not drift from the remote-verified checkpoint
- dependencies:
  - `validated_baseline_checkpoint.md`
  - `phase13_pre_entry_approval_memo.md`
  - `broader_rerun_manifest.json`
  - `broader_rerun_evidence.md`
- done condition:
  - the active execution thread explicitly references the verified broader-rerun baseline before any implementation work begins

## Task 2

- goal: define the first Phase13 work slice around the domain core only
- why it matters: starting with the core extraction/evidence path lowers regression risk and avoids premature expansion
- dependencies:
  - Task 1 complete
  - current domain/service boundaries understood
- done condition:
  - the first implementation slice is described in terms of domain/service work, not UI-first or productization work

## Task 3

- goal: encode regression protection requirements for the carried-forward watch/protection cases
- why it matters: `Case3`, `Case10`, and `Case36` are the known low-end risk anchors that must not silently degrade
- dependencies:
  - Task 1 complete
- done condition:
  - execution notes for the next work slice explicitly preserve:
    - `Case3` as watch-only
    - `Case10` as protected improved
    - `Case36` as protected cleared-blocker

## Task 4

- goal: sequence implementation work into small, controllable commits
- why it matters: smaller steps make it easier to isolate regressions and preserve the verified baseline
- dependencies:
  - Task 2 complete
  - Task 3 complete
- done condition:
  - the next execution plan is broken into discrete steps with clear code ownership and rollback boundaries

## Task 5

- goal: define the minimum verification gate for each later Phase13 code step
- why it matters: future work needs a consistent way to prove it did not erode the approved entry conditions
- dependencies:
  - Task 3 complete
  - Task 4 complete
- done condition:
  - each later code step has an explicit verification expectation tied to the core pipeline and watch/protection cases

## Task 6

- goal: keep non-core work deferred unless later explicitly authorized
- why it matters: scope drift is the fastest way to lose the baseline protections established before Phase13 entry
- dependencies:
  - Task 1 complete
- done condition:
  - productization, broad validation reruns, and unrelated refactors remain outside the active execution queue
