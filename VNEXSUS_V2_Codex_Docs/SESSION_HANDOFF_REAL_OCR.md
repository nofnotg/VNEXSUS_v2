# VNEXSUS V2 Session Handoff

Last updated: 2026-03-14

## 1. Purpose

Use this document to continue the current VNEXSUS_v2 work in a new Codex session without re-discovering the project state.

This handoff is focused on:

- `main` branch only
- real OCR execution readiness
- preserving the already-working localhost demo flow
- not adding unrelated features

## 2. Branch Rule

- Work on `main` only
- Start every new session with:

```bash
git checkout main
git pull
```

## 3. Current Verified Git State

Latest verified `main` state at handoff time:

- HEAD SHA: `7f8981bf41b9db7ce70d238b86ad9ef6098a735a`
- Latest commits:
  - `7f8981b test(e2e): stabilize OCR smoke timing`
  - `e7efef0 fix(ocr): wire real vision provider and inline ingestion`
  - `8d24a98 fix: make public main runnable locally and add e2e smoke coverage`

At handoff time, working tree was clean.

## 4. What Already Works

### Local Demo Mode

The following is already working on localhost in demo mode:

- app boot
- sign-in
- `/cases`
- `/cases/:caseId`
- `/settings`
- `/cases/analytics`
- file upload
- mock OCR
- investigator narrative
- consumer narrative
- PDF export
- Playwright smoke tests

### Verified commands

These were verified recently:

```bash
pnpm install
pnpm typecheck
pnpm test:epic2
pnpm test:e2e
```

## 5. Key OCR Changes Already Landed

### `e7efef0 fix(ocr): wire real vision provider and inline ingestion`

Changed files:

- `apps/web/lib/server/ocr/provider.ts`
- `apps/web/lib/server/services/job-service.ts`
- `apps/web/lib/server/services/job-service.test.ts`
- `apps/web/lib/server/services/ocr-ingestion-service.ts`
- `apps/web/lib/server/services/ocr-ingestion-service.test.ts`
- `apps/web/package.json`
- `packages/shared/src/env/load-env.ts`
- `packages/shared/src/env/schema.ts`

What this commit did:

- kept `mock` OCR mode intact
- added real Google Vision provider call path
- added env alias handling so documented variable names can still be read
- added readiness validation for missing real OCR credentials
- changed OCR job flow so ingestion can run inline without waiting for a real worker
- connected OCR ingestion to downstream steps:
  - OCR block persistence
  - date extraction
  - entity extraction
  - date-centered windows
  - EventAtom generation
  - EventBundle generation

### `7f8981b test(e2e): stabilize OCR smoke timing`

Changed file:

- `tests/e2e/local-runnable-smoke.spec.ts`

What it did:

- made the smoke test less timing-sensitive
- kept the demo smoke flow passing after OCR changes

## 6. Most Important Current Truth

The code path for real OCR is now wired.

The main remaining blockers are external:

- Google Vision billing
- real DB connection
- Redis connection
- actual runtime env values for real mode

This means:

- mock/demo success is real and stable
- real OCR is no longer blocked by missing code skeleton only
- real OCR is still blocked by environment/infrastructure readiness

## 7. Current Real OCR Blockers

### Google Vision billing

- Status: not ready
- Verified behavior: actual Google Vision call reached the API and failed with billing-related `PERMISSION_DENIED`
- Meaning: credentials are not the only blocker; project billing must be enabled

### Google credential

- Status: partially ready
- Notes:
  - the service-account file path documented under `env-and-auth` existed on this machine
  - but the runtime still needs the env wired for the current session when doing a real run

### `DATABASE_URL`

- Status: not ready
- Notes:
  - local `localhost:5432` was not reachable during verification
  - real OCR downstream persistence needs a real database

### `REDIS_URL`

- Status: not ready
- Notes:
  - local `localhost:6379` was not reachable during verification
  - demo path does not need Redis, but fuller integration readiness does

### storage

- Status: partially ready
- Notes:
  - local mirror storage works for demo and upload
  - real production-style storage validation has not been completed

## 8. Environment Sources Already Checked

Read these first in any new session:

### env/auth docs

- `VNEXSUS_V2_Codex_Docs/env-and-auth/CODEX_MESSAGE_ENV_AND_AUTH.md`
- `VNEXSUS_V2_Codex_Docs/env-and-auth/ENV_SETUP_FOR_CODEX.md`
- `VNEXSUS_V2_Codex_Docs/env-and-auth/env.example`

### Supabase docs

- `VNEXSUS_V2_Codex_Docs/vnexus_supabase/CODEX_DB_FIRST_MESSAGE.md`
- `VNEXSUS_V2_Codex_Docs/vnexus_supabase/SUPABASE_POSTGRESQL_CODEX_EXECUTION_GUIDE.md`

Important note:

- Supabase documentation exists in the repo
- Supabase MCP was not visible in the active MCP server list during the last session
- Supabase CLI was not available on PATH during the last session
- So the practical DB path is still: use Supabase connection strings through env and Prisma

## 9. Variables Most Likely Needed Next

Do not print secret values. Only verify presence.

### Real mode toggles

- `LOCAL_DEMO_MODE=false`
- `OCR_MODE=google-vision`

### OCR

- `GOOGLE_APPLICATION_CREDENTIALS`
- optionally `GOOGLE_CLOUD_VISION_API_KEY`
- `GOOGLE_CLOUD_PROJECT_ID`

### DB / infra

- `DATABASE_URL`
- optionally `DIRECT_URL` if Prisma migration flow is used
- `REDIS_URL`

### App/auth

- `APP_BASE_URL`
- `AUTH_SECRET`
- `SESSION_COOKIE_NAME`

### Storage

- `STORAGE_DRIVER`
- `STORAGE_BUCKET`
- optional `STORAGE_PUBLIC_BASE_URL`

## 10. Known Validation Behavior

This was already confirmed:

- when real OCR mode is selected but OCR credentials are missing, env validation returns a clear issue
- when Google Vision is actually called with the current GCP project, the failure is billing-related, not a generic code crash

This is good: the system now exposes the failure reason instead of silently returning empty OCR output.

## 11. Recommended Next Session Flow

If the goal is to continue toward real OCR execution, use this order:

1. `git checkout main`
2. `git pull`
3. read the env/auth docs
4. read the Supabase docs
5. verify whether MCP/CLI for Supabase are actually available in the new session
6. verify presence only for:
   - `LOCAL_DEMO_MODE`
   - `OCR_MODE`
   - `GOOGLE_APPLICATION_CREDENTIALS`
   - `DATABASE_URL`
   - `REDIS_URL`
7. if all are ready:
   - run app
   - open case detail
   - upload a real file
   - trigger real OCR
   - verify OCR blocks persisted
   - verify timeline/events
   - verify investigator narrative
   - verify consumer narrative
   - verify PDF export
8. if anything is missing:
   - ask only for the missing variable names
   - explain why each one is needed

## 12. Commands To Reuse

### Basic verification

```bash
git checkout main
git pull
pnpm install
pnpm typecheck
pnpm test:epic2
pnpm test:e2e
```

### Git evidence

```bash
git log --oneline -5
git rev-parse HEAD
git status
```

## 13. Do Not Regress

Do not break these guarantees:

- mock/demo OCR must continue to work
- route handlers must stay thin
- downstream extraction/report/PDF must keep working after OCR changes
- do not treat mock success as proof of real OCR success
- do not claim real OCR is ready unless billing, DB, Redis, and runtime env are actually verified

## 14. Handoff Summary In One Line

The project is in a good state for the next session: demo flow is stable, real OCR code path is wired, and the remaining work is external readiness verification rather than large code construction.
