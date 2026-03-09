좋다. 다음 단계에서 환경변수와 계정관리 구조를 아래 기준으로 반영하라.

1. 실제 비밀값은 절대 코드/문서/git에 넣지 말고, 변수명만 사용하라.
2. `.env.example`를 생성/정리하고, 실제 비밀값은 `.env.local` 또는 배포 시크릿 저장소에서만 주입하라.
3. env 로더는 Zod 기반으로 구현하고, 공통/웹/워커 스키마를 분리하라.
4. Google Vision은 서비스 계정 인증을 기본으로 하고, API key는 특정 경우에만 fallback으로 취급하라.
5. OpenAI API 키는 worker/server 전용으로 유지하라. 브라우저로 노출하지 마라.
6. Google OAuth client secret은 `GOOGLE_OAUTH_CLIENT_SECRET` 이름으로 정규화하라.
7. readiness check는 env 존재/형식만 검증하고 비밀값을 출력하지 마라.
8. 계정관리는 DB 없이 하지 마라. PostgreSQL + Prisma를 기준으로 users/profiles/roles/subscriptions/usage_ledger/consents/cases를 유지하라.
9. 비밀번호 인증을 직접 암호화부터 구현하지 말고, Auth.js 또는 동등한 검증된 auth/session 레이어를 사용하라.
10. Epic 0~1의 구현은 auth skeleton과 account persistence까지로 제한하고, billing/plan 실제 차감은 이후 Epic에서 다뤄라.
