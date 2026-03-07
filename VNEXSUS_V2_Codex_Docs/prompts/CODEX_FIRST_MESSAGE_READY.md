# CODEX 첫 메시지 - 바로 복붙용

첨부된 `VNEXSUS_V2_Codex_Docs` 문서 세트를 **단일 기준(spec)** 으로 사용하여 프로젝트를 구현하세요.

가장 중요한 규칙:
1. 문서에 없는 임의 기능 추가 금지
2. 기존 V1의 잘못된 구조 반복 금지
3. OCR 전체를 한 번에 최종 보고서로 보내는 구조 금지
4. evidence 없는 핵심 이벤트 확정 금지
5. 보험가입일 OCR 추출 금지. 사용자 입력 case metadata 로만 처리
6. 라우트는 얇게, 서비스/도메인 계층은 두껍게 유지
7. 내부 HTTP 재호출 구조 금지
8. UI를 코어보다 먼저 만들지 말 것
9. 모든 중간 단계는 가능한 한 구조화된 JSON 계약을 우선할 것
10. 구현은 문서의 Epic 순서를 따른다

문서 읽기 순서:
1. `00_READ_FIRST.md`
2. `00A_START_HERE_ONE_ENTRY.md`
3. `02_MASTER_PRD.md`
4. `03_CODEX_EXECUTION_RULES.md`
5. `04_SYSTEM_ARCHITECTURE.md`
6. `05_DATE_EVENT_EXTRACTION_SPEC.md`
7. `06_EVIDENCE_CONTRACT.md`
8. `07_LLM_STRATEGY_AND_PROMPTS.md`
9. `08_AUTH_ROLES_PLANS_BILLING_ADMIN.md`
10. `09_DATA_MODEL_AND_DB_SCHEMA.md`
11. `10_API_CONTRACTS.md`
12. `11_EPICS_TASKS_AND_DELIVERY_PLAN.md`
13. `12_ACCEPTANCE_QA_AND_GOLDENSET.md`
14. `13_MIGRATION_FROM_V1.md`
15. `14_LEGAL_AND_CONSENT_PLACEHOLDERS.md`
16. `01_EXPERT_PANEL_REVIEW.md`

플랜/역할 고정값:
- 일반사용자 플랜: `미리확인`, `정밀확인`, `전문가연결`
- 조사자 플랜: `Starter`, `Pro`, `Studio`
- 일반사용자와 조사자는 회원가입 시 role 이 분리되어야 하며, 결과 UX도 달라야 한다.
- 보험가입일은 OCR 추출 대상이 아니며 user input metadata 이다.

OCR/정밀분석 원칙:
- `미리확인`은 OCR 중심 기본 분석
- `정밀확인`부터 선택적 정밀분석을 허용
- 조사자 `Pro` 이상은 선택적 또는 자동 정밀분석을 포함할 수 있음
- 추가 분석은 ambiguity_score 또는 고위험 이벤트 감지 시 제안한다

가장 먼저 해야 할 일:
코드를 바로 쓰지 말고, 아래 8개를 먼저 출력하라.
1. 문서 전체 이해 요약
2. 구현 범위 / 비범위
3. 시스템 경계와 모듈 경계
4. 초기 폴더 구조 제안
5. DB schema 초안
6. 환경변수 목록 초안
7. Epic 0 ~ Epic 2 구현 순서
8. 현재 가장 큰 리스크 5개와 대응 전략

그 다음에만 구현을 시작하라.

구현 시작 규칙:
- Epic 0부터 순차 진행
- 각 단계마다 아래 형식으로 보고
  - 목표
  - 이번 단계에서 읽은 기준 문서
  - 생성/수정 파일 목록
  - 코드
  - 테스트
  - 실행 방법
  - 남은 리스크
  - 다음 단계

현재 우선순위:
1. 날짜-이벤트 추출 엔진
2. click-to-evidence 계약
3. OCR/정밀분석 분기 구조
4. auth/roles/plans/billing skeleton
5. report rendering
6. admin/consent skeleton

특히 날짜-이벤트 추출 엔진에서는 다음을 반드시 지켜라.
- `DateCandidate -> EventAtom -> EventBundle -> ReportSlot -> ReportText` 흐름 유지
- 이벤트는 evidence 없이 확정하지 말 것
- 허수 날짜, 발급일, 예정일, 문서 행정일과 실제 의료이벤트 날짜를 구분할 것
- report_sample 스타일의 9~10항목 구조를 유지할 것
- ICD/KCD, 한글/영문 병기 가능 구조를 확보할 것

이제 문서를 읽고, 먼저 8개 항목을 출력하라. 코드는 그 다음이다.
