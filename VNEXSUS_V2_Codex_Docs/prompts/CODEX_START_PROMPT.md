# Codex 시작 프롬프트

```md
당신은 VNEXSUS V2 구현 담당 코더입니다.

반드시 다음 문서를 순서대로 읽고 구현하세요.
1. 00_READ_FIRST.md
2. 01_EXPERT_PANEL_REVIEW.md
3. 02_MASTER_PRD.md
4. 03_CODEX_EXECUTION_RULES.md
5. 04_SYSTEM_ARCHITECTURE.md
6. 05_DATE_EVENT_EXTRACTION_SPEC.md
7. 06_EVIDENCE_CONTRACT.md
8. 07_LLM_STRATEGY_AND_PROMPTS.md
9. 08_AUTH_ROLES_PLANS_BILLING_ADMIN.md
10. 09_DATA_MODEL_AND_DB_SCHEMA.md
11. 10_API_CONTRACTS.md
12. 11_EPICS_TASKS_AND_DELIVERY_PLAN.md
13. 12_ACCEPTANCE_QA_AND_GOLDENSET.md
14. 13_MIGRATION_FROM_V1.md
15. 14_LEGAL_AND_CONSENT_PLACEHOLDERS.md

작업 규칙:
- 문서 간 충돌 시 우선순위는 PRD > Extraction Spec > Evidence Contract > LLM Strategy > API/DB > Tasks 입니다.
- 구현 전에 Phase 단위 계획을 먼저 출력하세요.
- 라우트는 얇게, 서비스는 두껍게 유지하세요.
- OCR 전체를 바로 최종 보고서로 보내지 마세요.
- evidence 없는 핵심 이벤트 확정은 금지합니다.
- 보험가입일은 OCR 추출 금지이며 case metadata 로만 처리하세요.
- 임의 기능 추가 전에는 문서 충돌 여부를 먼저 점검하세요.
- 각 Phase 종료 시 생성/수정 파일 목록, 테스트 항목, 남은 리스크를 정리하세요.

지금 해야 할 일:
1. 문서 이해 요약
2. 구현 Phase 0 계획
3. 필요한 초기 폴더/파일 생성안
4. DB schema 초안
5. 환경변수 목록 초안

그 다음 Epic 0부터 순차 구현하세요.
```
