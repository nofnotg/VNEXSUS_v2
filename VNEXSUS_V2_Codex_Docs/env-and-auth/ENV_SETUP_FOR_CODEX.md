# VNEXSUS V2 — Environment & Secrets Setup for Codex

## 0. Immediate security action
The raw secret values were shared in chat. Do **not** copy those raw values into prompts, AGENTS.md, config.toml, git history, issues, PR descriptions, or markdown docs.

Rotate/revoke these immediately before real development continues:
- OpenAI API key
- Google Cloud Vision API key
- Google OAuth client secret
- Google service account key file / key material

After rotation, store only the **new** values in local secret files or deployment secret managers.

---

## 1. Core rule for Codex
Codex must receive **variable names, schemas, file locations, and loading rules** — not raw secrets.

Codex may:
- create `.env.example`
- create env loaders and Zod schemas
- create readiness checks
- create deployment docs
- wire variable names into server code

Codex must **not**:
- hardcode real keys
- print secret values in logs
- commit secrets
- place secrets inside `AGENTS.md`, `config.toml`, markdown specs, tests, fixtures, or screenshots

---

## 2. Canonical environment variable names
Use the following normalized names.

### Common app/server
- `NODE_ENV`
- `APP_URL`
- `APP_TIMEZONE`
- `APP_DEFAULT_LOCALE`

### Database / infra
- `DATABASE_URL`
- `REDIS_URL`
- `STORAGE_DRIVER`
- `STORAGE_BUCKET`
- `STORAGE_REGION`
- `STORAGE_ENDPOINT`
- `STORAGE_ACCESS_KEY_ID`
- `STORAGE_SECRET_ACCESS_KEY`

### Google Cloud / OCR
- `GCP_PROJECT_ID`
- `GCS_BUCKET_NAME`
- `GCP_PUBSUB_TOPIC`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `GOOGLE_CLOUD_VISION_API_KEY`
- `GOOGLE_CLOUD_RUN_BASE64_ENDPOINT`

### LLM / AI
- `OPENAI_API_KEY`
- `LLM_PROVIDER`
- `LLM_MODEL_SPOT_RESOLVER`
- `LLM_MODEL_CASE_HELPER`

### Auth / session
- `AUTH_SECRET`
- `AUTH_BASE_URL`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

### Billing
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### App limits / thresholds
- `MAX_UPLOAD_FILE_MB`
- `MAX_CASE_DOCUMENTS`
- `PRECISION_AMBIGUITY_THRESHOLD`
- `REVIEW_REQUIRED_EVIDENCE_MIN_COUNT`

### Consent versioning
- `CONSENT_TERMS_VERSION`
- `CONSENT_PRIVACY_VERSION`
- `CONSENT_SENSITIVE_VERSION`
- `CONSENT_AI_NOTICE_VERSION`
- `CONSENT_EXPERT_CONNECTION_VERSION`

---

## 3. File placement rules
### Local development
- Repo root: `.env.example` -> committed
- Repo root: `.env.local` -> **not committed**
- Optional app-specific local files:
  - `apps/web/.env.local`
  - `apps/worker/.env.local`

### Production / deployment
- Never upload real secrets in repo files.
- Store secrets in platform secret manager / deployment env settings.
- Web runtime and worker runtime may use different secret scopes.

---

## 4. Split by runtime
### Web runtime (Next.js server-only)
Allowed:
- `AUTH_SECRET`
- `AUTH_BASE_URL`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `DATABASE_URL`
- `APP_URL`

Do **not** expose server secrets to browser bundles.
Only `NEXT_PUBLIC_*` variables may be public.

### Worker runtime
Allowed:
- `DATABASE_URL`
- `REDIS_URL`
- `GCP_PROJECT_ID`
- `GCS_BUCKET_NAME`
- `GCP_PUBSUB_TOPIC`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `GOOGLE_CLOUD_VISION_API_KEY` (only if truly required)
- `GOOGLE_CLOUD_RUN_BASE64_ENDPOINT`
- `OPENAI_API_KEY`
- model variables

---

## 5. Provider policy
### Google Vision
Prefer **service account auth** in server/worker code.
Treat API key as optional fallback only when a specific endpoint requires it.

### Cloud Run image-to-base64 endpoint
Treat `GOOGLE_CLOUD_RUN_BASE64_ENDPOINT` as service configuration.
If this endpoint should be private later, move toward authenticated invocation.

### OpenAI
`OPENAI_API_KEY` is worker/server-only.
Never expose to web client.

### OAuth
Rename any field currently labeled like `PW` to canonical `GOOGLE_OAUTH_CLIENT_SECRET`.
Do not store or log it anywhere except secret storage.

---

## 6. What Codex must implement
Codex should:
1. Create shared env schemas in `packages/shared/src/env`.
2. Split env validation by runtime:
   - `commonServerEnvSchema`
   - `webEnvSchema`
   - `workerEnvSchema`
3. Add readiness checks that validate **presence and schema**, not raw values.
4. Ensure secrets never appear in logs or API responses.
5. Commit `.env.example` only.
6. Add `.env*` patterns to `.gitignore` while keeping `.env.example` tracked.
7. Use `insuranceJoinDate` only as app data, never as OCR-derived env/config.

---

## 7. Account management architecture decision
Do **not** build account management without a database.
Even if login is outsourced, the app still needs persistent tables for:
- users
- profiles
- roles
- subscriptions
- usage ledger
- consents
- cases
- connection requests

Recommended approach for this project:
- Managed PostgreSQL platform (Supabase, Neon, RDS, etc.)
- Prisma as ORM
- Auth.js (or equivalent) for auth/session handling
- App-owned tables for roles, plans, consent history, usage, and case ownership

Do **not** hand-roll password auth from scratch.

---

## 8. Codex handoff instruction
Give Codex this instruction:

"Implement environment and secret handling using variable names only. Do not hardcode or echo secret values. Create `.env.example`, Zod-based env loaders, runtime-specific validation, and readiness checks. Keep all server/worker secrets out of client bundles. Treat Google Vision service account auth as primary, API key as optional fallback, and keep OpenAI keys worker/server-only. Use PostgreSQL + Prisma for persistent account/role/plan/consent/case data. Do not build custom password cryptography from scratch." 

---

## 9. Rotation checklist
Before public or team development continues:
- rotate OpenAI API key
- rotate Google Vision API key and restrict it
- rotate Google OAuth client secret
- create a new Google service account key and revoke the old one
- replace all old secret values in local/deployment secret stores
