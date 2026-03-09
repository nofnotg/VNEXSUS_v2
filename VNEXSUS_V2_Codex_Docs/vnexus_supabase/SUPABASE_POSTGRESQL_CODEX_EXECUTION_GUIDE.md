# VNEXSUS V2 — Supabase/PostgreSQL + Codex 실행지침

## 1. 최종 선택
- 기본 DB 플랫폼은 **Supabase**로 선택한다.
- 별도의 독립 PostgreSQL 서버를 따로 운영하지 않는다.
- 이유: Supabase는 **관리형 PostgreSQL + Auth + Storage + RLS**를 함께 제공하므로, 비개발자 운영 기준에서 유지보수 부담이 가장 낮다.
- 애플리케이션은 **Prisma**를 통해 Supabase PostgreSQL에 연결한다.

## 2. 해석
- `Supabase`를 선택한다는 것은 결국 **관리형 PostgreSQL을 선택하는 것**이다.
- 즉, `Supabase 또는 PostgreSQL`의 관계가 아니라,
  - self-hosted PostgreSQL
  - managed PostgreSQL(Supabase)
  중에서 **Supabase**를 고르는 것이다.
- 따라서 둘을 별도로 중복 운영하지 않는다.

## 3. Codex 운영 원칙
Codex가 모든 것을 마음대로 직접 관리하게 두지 않는다.

### 허용
- Prisma schema 작성/수정
- migration 파일 생성
- seed 스크립트 작성
- 개발/스테이징 환경에서 schema 적용
- read-only 조회 쿼리 작성
- RLS 정책 초안 작성
- Auth/role 관련 코드 작성

### 제한
- 운영(Production) DB에 대한 무제한 직접 쓰기 금지
- destructive SQL (`drop`, `truncate`, 무차별 delete/update) 자동 실행 금지
- service_role key를 프롬프트/문서/git에 노출 금지
- 사용자 비밀번호/민감정보 직접 조회 로직 작성 금지

### 원칙
- 운영 DB 변경은 항상 **Prisma migration + 사람이 승인한 배포** 경로로만 반영한다.
- Codex는 “설계/코드/마이그레이션 생성자”이지, “프로덕션 DB 관리자”가 아니다.

## 4. 인프라 경계
### Supabase가 담당
- users / profiles
- roles / memberships / organizations
- subscriptions / usage_ledger
- consents / consent_versions
- cases / case_patient_inputs
- report metadata / connection_requests
- 필요 시 export 파일/썸네일용 Storage
- Auth
- RLS 정책

### GCP가 담당
- GCS 원본 문서 저장
- Vision OCR
- Pub/Sub
- Cloud Run/Cloud Functions
- OCR 중간 산출물

### 앱이 담당
- Next.js 웹앱
- worker
- OpenAI 정밀분석
- domain rules
- evidence registry
- date-event extraction

## 5. 연결 방식
### Prisma 연결
- `DATABASE_URL`: Supabase pooled connection 사용
- `DIRECT_URL`: Prisma CLI/migration용 direct connection 사용

### 권장 env
- DATABASE_URL=postgres://...pooler...:6543/postgres?pgbouncer=true
- DIRECT_URL=postgres://...db.<project-ref>.supabase.co:5432/postgres
- SUPABASE_URL=
- SUPABASE_ANON_KEY=
- SUPABASE_SERVICE_ROLE_KEY=

## 6. 환경 분리
반드시 3개 환경으로 나눈다.
- local
- staging
- production

### Codex 권한
- local: 쓰기 가능
- staging: 제한적 쓰기 가능
- production: 원칙적 read-only, migration은 사람 승인 후 실행

## 7. 계정관리 구조
### 인증
- Supabase Auth 사용
- 이메일/비밀번호 + Google OAuth 우선
- 조사자 role은 가입 후 verification 상태 분리

### 앱 DB가 직접 관리하는 것
- role
- investigator_verification_status
- subscription
- usage_ledger
- consent history
- case ownership
- expert connection request

## 8. RLS 원칙
- public schema의 노출 테이블은 모두 RLS를 켠다.
- 일반사용자는 자기 케이스만 조회 가능
- 조사자는 자기 소유/배정 케이스만 조회 가능
- 관리자는 별도 admin path/service role 경로에서만 전체 조회
- worker는 브라우저 토큰이 아니라 서버 권한으로 동작

## 9. Codex 실행 순서
### Step 1
Supabase를 primary DB/Auth platform으로 채택하고 Prisma 연결 구조를 고정한다.

### Step 2
다음 테이블 기준으로 Prisma schema를 확정한다.
- users(앱 확장 프로필용)
- profiles
- organizations
- memberships
- plans
- subscriptions
- usage_ledger
- consent_versions
- consents
- cases
- case_patient_inputs
- source_documents
- source_pages
- ocr_blocks
- evidence_refs
- analysis_jobs
- reports
- connection_requests

### Step 3
RLS 정책 초안을 작성한다.
- consumer self access
- investigator scoped access
- admin restricted access

### Step 4
local/staging용 migration 실행 스크립트를 만든다.
- pnpm prisma generate
- pnpm prisma migrate dev
- pnpm prisma db seed

### Step 5
production은 절대 자동 실행하지 말고, migration review checklist를 만든다.

## 10. Codex에 전달할 강제 지침
- Use Supabase as the primary managed PostgreSQL/Auth platform.
- Do not introduce a separate self-hosted PostgreSQL server.
- Use Prisma as the application data access and migration layer.
- Keep production database changes behind human approval.
- Never put secret values in code, docs, git, prompts, or test fixtures.
- Treat Supabase service role key as server-only.
- Enable and preserve RLS on exposed tables.
- Do not use Codex for unrestricted production data administration.

## 11. Codex에 바로 넣을 메시지
첨부된 문서를 기준으로 다음을 수행하라.

1. Supabase를 primary managed PostgreSQL/Auth platform으로 고정하라.
2. 별도 self-hosted PostgreSQL 서버는 도입하지 마라.
3. Prisma를 schema/migration/query abstraction으로 사용하라.
4. DATABASE_URL / DIRECT_URL 구조를 반영해 env.example을 갱신하라.
5. Prisma schema에 users, profiles, memberships, subscriptions, usage_ledger, consents, cases, source_documents, source_pages, ocr_blocks, evidence_refs, analysis_jobs, reports를 반영하라.
6. public schema에서 노출되는 테이블에 대한 RLS 정책 초안을 작성하라.
7. local/staging/prod 환경 분리 전략을 문서화하라.
8. production에 대해서는 destructive operation 자동화 금지와 migration approval 규칙을 추가하라.
9. 다음 순서로 출력하라:
   - Supabase adoption decision
   - Prisma schema updates
   - env.example updates
   - RLS policy outline
   - migration workflow
   - auth integration plan
10. 실제 secret 값은 절대 출력하거나 저장하지 마라.

## 12. 최종 운영 원칙
- 비개발자 운영 편의성을 기준으로, DB 플랫폼은 Supabase 하나로 통일한다.
- PostgreSQL은 Supabase 내부 관리형 Postgres를 사용한다.
- OCR/문서 파이프라인은 기존 GCP 자산을 유지한다.
- Codex는 코드/스키마/마이그레이션을 작성할 수 있지만, 운영 DB를 전권 관리하게 두지 않는다.
