Supabase를 VNEXSUS V2의 primary managed PostgreSQL/Auth platform으로 채택한다.

중요 원칙:
- 별도 self-hosted PostgreSQL 서버를 추가하지 마라.
- Supabase = managed PostgreSQL + Auth + RLS + optional Storage 로 본다.
- Prisma를 schema/migration/query abstraction으로 사용하라.
- production DB 변경은 human approval이 있는 migration workflow로만 반영하라.
- Codex가 production database를 unrestricted하게 직접 관리하게 만들지 마라.
- 실제 secret 값은 절대 코드/문서/git/출력에 넣지 마라.

이제 다음을 수행하라.
1. 현재 아키텍처 문서에 Supabase 채택 결정을 반영하라.
2. Prisma schema를 Supabase 기준으로 점검/보완하라.
3. env.example에 DATABASE_URL / DIRECT_URL / SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY를 반영하라.
4. Auth integration 계획을 Supabase Auth 기준으로 다시 작성하라.
5. public schema 노출 테이블에 대한 RLS policy outline을 작성하라.
6. local / staging / production 환경별 DB 운영 규칙을 문서화하라.
7. migration workflow를 작성하라.

출력 순서:
- adoption decision
- schema updates
- env updates
- auth plan
- RLS outline
- migration workflow
- then code changes
