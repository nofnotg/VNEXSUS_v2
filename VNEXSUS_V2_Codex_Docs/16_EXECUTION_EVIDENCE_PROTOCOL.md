# Execution Evidence Protocol

Last updated: 2026-03-14

## 1. Goal

Use this document when an external reviewer, PM, or web-based GPT needs to verify whether a VNEXSUS_v2 step was actually completed, instead of relying on a verbal status update.

This protocol is intentionally simple:

1. identify the target commit
2. identify the exact feature or recovery step
3. collect the matching local evidence
4. classify the result as `working`, `partially working`, or `blocked`

## 2. Minimum Evidence Set Per Step

Every meaningful step should be backed by all of the following:

- Git evidence
  - commit SHA
  - commit message
  - changed file list
- Runtime evidence
  - exact command used
  - route or API reached
  - actual result
- Test evidence
  - related automated test command
  - pass/fail result
- Blocker evidence
  - if not working, the exact missing dependency or external condition

Do not mark a step complete with code presence only.

## 3. Required Command Set

Use these commands first:

```bash
git checkout main
git pull
git log --oneline -5
git rev-parse HEAD
git status
pnpm typecheck
pnpm test:e2e
```

If a step is pipeline-specific, add the narrowest matching test command:

```bash
pnpm test:epic2
```

## 4. Step Verification Template

Use this template for each major step:

### Step Name

- Target: what should work
- Commit: SHA and message
- Files: key files only
- Command: exact command or route
- Evidence: what was actually observed
- Verdict:
  - `working`
  - `partially working`
  - `blocked`
- Blocker:
  - write `none` if working
  - otherwise write one concrete blocker only
- Next action:
  - the next smallest step needed to move forward

## 5. Current High-Value Steps To Track

These are the steps that should always have evidence attached:

1. localhost boot
2. sign-in entry
3. `/cases`
4. `/cases/:caseId`
5. upload
6. OCR
7. OCR block persistence
8. extraction and event generation
9. investigator narrative
10. consumer narrative
11. PDF export
12. analytics
13. Playwright smoke

## 6. Current Canonical Evidence Files

Start with these repo files before asking for a new walkthrough:

- `README.md`
- `VNEXSUS_V2_Codex_Docs/SESSION_HANDOFF_REAL_OCR.md`
- `VNEXSUS_V2_Codex_Docs/16_EXECUTION_EVIDENCE_PROTOCOL.md`
- `VNEXSUS_V2_Codex_Docs/codex_setup/AGENTS.md`
- `VNEXSUS_V2_Codex_Docs/codex_setup/SMITHERY_MCP_SETUP.md`

## 7. How To Read The Current Project State

### Demo Mode

Treat a step as demo-verified only if:

- the app boots locally
- the route actually renders
- the action can be clicked through
- a matching smoke or targeted test passes

### Real OCR Mode

Treat real OCR as verified only if:

- upload succeeds
- OCR provider is called in real mode
- OCR blocks persist
- extraction completes
- events appear in the case detail timeline
- at least one downstream narrative or PDF result is reachable

If billing, credentials, DB, Redis, or storage readiness is missing, classify the step as `blocked`, not `working`.

## 8. Evidence Classification Rules

- `working`
  - route/action was executed
  - expected output appeared
  - no external blocker remained

- `partially working`
  - some part executed, but downstream completion was not verified
  - or demo mode works but real mode does not

- `blocked`
  - execution stops because of one or more concrete external or runtime blockers

Examples:

- mock OCR passes but real OCR is not configured -> `partially working`
- Google Vision responds with billing error -> `blocked`
- narrative page renders after mock OCR -> `working`

## 9. Recommended Proof Package For External GPT Review

When sharing progress with an external GPT web session, provide this bundle:

1. latest `main` SHA
2. latest 3 to 5 commit messages
3. one sentence on the target step
4. one evidence snippet
5. one blocker snippet if not complete
6. one next action

Example package:

- SHA: `7f8981b`
- Step: `real OCR provider wiring`
- Evidence: `pnpm test:epic2` passed and `pnpm test:e2e` passed
- Blocker: `Google Vision billing not enabled`
- Next action: `enable billing and rerun upload -> OCR -> narrative flow`

## 10. What Not To Do

- Do not say "implemented" when only files were added.
- Do not say "working" when only mock mode passed.
- Do not use screenshots alone without command or route evidence.
- Do not hide blockers behind vague wording like "needs more setup".

## 11. One-Line Rule

If an external reviewer cannot answer "what works, what is blocked, and how it was proven" from the evidence package, the step is not documented enough yet.
