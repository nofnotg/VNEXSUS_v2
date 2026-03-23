# VNEXSUS V2 문서 세트 먼저 읽기

## 목적

이 문서 세트는 `VNEXSUS V2`를 설계사 실사용 중심의 의료문서 분석 앱으로 구현하기 위한 단일 기준 문서 묶음이다.

이제 제품 방향은 다음처럼 이해해야 한다.

- 앱의 핵심은 의료문서에서 날짜-이벤트를 구조화하고 evidence와 함께 보여주는 코어 엔진이다.
- 이 엔진은 설계사가 고객 보험금 청구 건을 사전 검토하고 추가 확인 포인트를 찾는 데 쓰인다.
- 결과물은 “최종 손해사정 보고서 자동작성기”가 아니라 “분석 화면 + 파생 리포트” 구조로 해석해야 한다.
- Starter / Pro는 이 앱의 상품 계층이다.
- productization은 아직 일부만 계획 수준이며, 코어 엔진보다 먼저 구현하지 않는다.

## 가장 중요한 현재 방향

### 제품 타깃

- 기본 타깃은 `설계사`
- 설계사가 고객의 보험금청구 건을 현장에서 빠르게 검토할 수 있어야 한다.
- 손해사정사 수준의 세부 검토 흐름 중 일부를 도와주는 도구이지만, 앱 자체가 보험사/의사의 최종 판단을 대체하지는 않는다.

### 상품 구조

- `Starter`
  - 의료 이벤트 시계열 정리
  - 주요 질환군/수술/입원/검사 개괄 정리
  - 보험가입일 기준 고지의무 검토 개요
  - 정확도/편차/누락 가능성 안내
  - 의료적/보험적 최종 판단 금지 안내
- `Pro`
  - Starter 전체 포함
  - selective vision cross-check
  - 더 깊은 질환군별 정리
  - 질문/검색/재질문 기능
  - 보다 강한 evidence drill-down

### 절대 고정 규칙

1. 보험가입일은 OCR 추출 대상이 아니다. 항상 사용자 입력 case metadata 이다.
2. evidence 없는 핵심 이벤트는 확정하지 않는다.
3. 구조화 JSON이 먼저고, narrative/report는 그 다음이다.
4. route는 얇게, 서비스/도메인 계층은 두껍게 유지한다.
5. extraction 보호 경로를 함부로 다시 열지 않는다.
6. productization 기능은 코어 엔진보다 먼저 붙이지 않는다.

## 현재 문서 해석 규칙

이 문서 세트 안에는 예전 방향의 흔적이 일부 남아 있다.

특히 아래 문서군은 이제 `설계사 단일 타깃 + Starter/Pro` 기준으로 해석해야 한다.

- `02_MASTER_PRD.md`
- `08_AUTH_ROLES_PLANS_BILLING_ADMIN.md`
- `11_EPICS_TASKS_AND_DELIVERY_PLAN.md`

그리고 아래 문서는 새 방향을 반영한 canonical realign 문서로 우선 참고한다.

- `medical_app_realign_plan_2026-03-23.md`
- `17_PRODUCT_DIRECTION_REALIGN.md`
- `18_STARTER_PRO_PRODUCT_MAP.md`
- `19_SIGNUP_SOCIAL_LOGIN_AND_BILLING_POLICY.md`

## 문서 읽기 순서

1. `00_READ_FIRST.md`
2. `00A_START_HERE_ONE_ENTRY.md`
3. `medical_app_realign_plan_2026-03-23.md`
4. `17_PRODUCT_DIRECTION_REALIGN.md`
5. `18_STARTER_PRO_PRODUCT_MAP.md`
6. `19_SIGNUP_SOCIAL_LOGIN_AND_BILLING_POLICY.md`
7. `02_MASTER_PRD.md`
8. `03_CODEX_EXECUTION_RULES.md`
9. `04_SYSTEM_ARCHITECTURE.md`
10. `05_DATE_EVENT_EXTRACTION_SPEC.md`
11. `06_EVIDENCE_CONTRACT.md`
12. `07_LLM_STRATEGY_AND_PROMPTS.md`
13. `08_AUTH_ROLES_PLANS_BILLING_ADMIN.md`
14. `09_DATA_MODEL_AND_DB_SCHEMA.md`
15. `10_API_CONTRACTS.md`
16. `11_EPICS_TASKS_AND_DELIVERY_PLAN.md`
17. `12_ACCEPTANCE_QA_AND_GOLDENSET.md`
18. `13_MIGRATION_FROM_V1.md`
19. `14_LEGAL_AND_CONSENT_PLACEHOLDERS.md`
20. `01_EXPERT_PANEL_REVIEW.md`

## 구현 우선순위

1. date-event extraction
2. evidence linkage
3. structured slot JSON
4. Starter / Pro 분석 출력
5. auth / social login / billing skeleton
6. admin / export / release readiness

## 하지 말아야 할 것

- consumer / investigator 이원 제품 구조를 다시 기본값으로 되돌리지 말 것
- OCR 전체를 한 번에 최종 보고서로 보내지 말 것
- extraction 보호 파일을 문서 개편 핑계로 건드리지 말 것
- 의료적/보험적 최종 판단을 앱이 내리는 것처럼 쓰지 말 것
- UI나 결제를 코어 엔진보다 먼저 만들지 말 것

## 최종 한 문장

`VNEXSUS V2`는 이제 “일반사용자용 안내 SaaS + 조사자용 보고서 SaaS”가 아니라, **설계사가 보험금청구 건을 검토할 때 쓰는 의료문서 분석 앱**으로 정렬되어야 한다.
