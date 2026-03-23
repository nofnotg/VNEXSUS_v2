# VNEXSUS V2 시작 파일

이 문서는 비개발자인 운영자 기준으로, Codex가 어떤 문서를 기준으로 읽고 어떤 방향으로 구현을 해석해야 하는지 한 번에 정리한 시작 파일이다.

## 핵심 원칙

- 현재 제품 방향은 `설계사 단일 타깃` 기준이다.
- 기존의 `일반사용자 / 조사자` 이원 제품 구조는 더 이상 기본 방향이 아니다.
- 코어 엔진은 계속 유지하되, 출력과 상품 정의는 `Starter / Pro` 기준으로 다시 정렬한다.
- 구현보다 먼저 문서 방향 정렬이 우선이다.

---

## 실제 시작 방법

### 1단계

프로젝트 작업 공간에 아래 문서 폴더를 둔다.

- `VNEXSUS_V2_Codex_Docs`

### 2단계

Codex 또는 IDE 채팅창에 아래 메시지를 그대로 붙여넣는다.

### 3단계

Codex가 아래를 먼저 출력하는지 확인한다.

- 문서 이해 요약
- 현재 제품 방향 요약
- 구현 범위 / 비범위
- 시스템 경계
- 초기 폴더 구조
- DB schema 초안
- 환경변수 목록
- 구현 순서와 리스크

위 항목이 나오기 전에는 코딩을 승인하지 않는다.

---

## 복붙용 첫 메시지

첨부된 `VNEXSUS_V2_Codex_Docs` 문서 세트를 단일 기준(spec)으로 사용하여 프로젝트를 진행하세요.

가장 중요한 규칙:

1. 문서에 없는 임의 기능 추가 금지
2. 기존 V1의 잘못된 구조 반복 금지
3. OCR 전체를 한 번에 최종 결과로 보내는 구조 금지
4. evidence 없는 핵심 이벤트 확정 금지
5. 보험가입일 OCR 추출 금지. 사용자 입력 case metadata 로만 처리
6. route는 얇게, 서비스/도메인 계층은 두껍게 유지
7. 내부 HTTP 재호출 구조 금지
8. UI를 코어보다 먼저 만들지 말 것
9. 모든 중간 단계는 구조화 JSON 계약을 우선할 것
10. 현재 제품 타깃은 설계사이며, Starter / Pro 구조를 기준으로 해석할 것

문서 읽기 순서:

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

현재 제품 방향 해석 규칙:

- 이 앱은 설계사가 고객의 보험금청구 건을 분석할 때 쓰는 의료문서 분석 도구이다.
- Starter는 현장 1차 분석층이고, Pro는 심층 분석층이다.
- 보고서는 최종 파생 출력물 중 하나이지, 제품 전체 정체성 그 자체가 아니다.
- 의료적/보험적 최종 판단은 앱이 하지 않는다.
- productization은 계획 대상이지만 여전히 코어 엔진보다 뒤 순서다.

가장 먼저 해야 할 일:
코드를 바로 쓰지 말고, 아래 항목을 먼저 출력하라.

1. 문서 전체 이해 요약
2. 현재 제품 방향 요약
3. 구현 범위 / 비범위
4. 시스템 경계와 모듈 경계
5. 초기 폴더 구조 제안
6. DB schema 초안
7. 환경변수 목록 초안
8. 가장 큰 리스크 5개와 대응 전략

그 다음에만 구현을 시작하라.

현재 우선순위:

1. 날짜-이벤트 추출 엔진
2. click-to-evidence 계약
3. Starter / Pro 분석 출력 체계
4. 선택적 정밀분석 / selective vision 경계
5. auth / social login / billing skeleton
6. admin / export

이제 문서를 읽고, 먼저 위 항목을 출력하라. 코드는 그 다음이다.

---

## 운영자 체크포인트

아래가 보이면 방향이 흐려진 것이다.

- 설계사 단일 타깃이 다시 consumer / investigator 이원 구조로 되돌아가는 경우
- date-event extraction 보다 로그인 화면이나 결제부터 만드는 경우
- evidence contract 없이 보고서 텍스트부터 만드는 경우
- 보험가입일을 OCR 또는 문서 텍스트에서 찾으려는 경우
- Starter / Pro가 아닌 예전 플랜 구조를 기본값으로 설명하는 경우

---

## 한 문장 기억

**코어 엔진은 유지하되, 제품 해석은 설계사용 Starter / Pro 의료문서 분석 앱 기준으로 다시 정렬한다.**
