# VNEXSUS V2 문서 세트 — 먼저 읽기

## 목적
이 문서 세트는 `VNEXSUS V2`를 처음부터 다시 구축하기 위한 단일 기준 문서 묶음이다.

목표:
1. 비개발자인 제품 오너가 세부 구현에 계속 개입하지 않아도 된다.
2. 코더가 문서를 순서대로 읽고 구현해도 구조가 흔들리지 않는다.
3. 날짜-이벤트 추출, evidence 연결, 보고서 품질이 중심축으로 유지된다.
4. 일반사용자와 손해사정조사자 UX가 하나의 엔진 위에서 역할별로 분기된다.

## 한 줄 정의
의료문서를 OCR로 추출하고, 날짜-이벤트를 근거와 함께 구조화하여,
조사자용 경과보고서와 일반사용자용 리스크 안내 결과를 제공하는 SaaS 플랫폼

## 가장 중요한 원칙 10개
1. 보험가입일은 OCR로 추출하지 않는다. `case metadata`로만 입력받는다.
2. 모든 핵심 이벤트는 근거(evidence)를 가져야 한다.
3. 보고서는 자유문 생성보다 `구조화 → 렌더링` 순서로 만든다.
4. 날짜 추출보다 중요한 것은 의미 있는 날짜 판정이다.
5. 미리확인/Starter는 OCR 기반, 상위 플랜은 선택적 정밀분석 기반으로 간다.
6. 전체 문서를 한 번에 정밀모델로 처리하지 않는다.
7. LLM은 전체 대행자가 아니라 spot resolver + case helper 역할로 쓴다.
8. 조사자용 결과와 일반사용자용 결과는 동일한 이벤트 엔진에서 파생된다.
9. 라우트는 얇게, 서비스는 두껍게, 도메인 계층은 독립적으로 유지한다.
10. 공개 오픈 전에는 민감정보 동의/처리방침/보안 정책 최소본이 반드시 갖춰져야 한다.

## 문서 읽는 순서
1. `00_READ_FIRST.md`
2. `01_EXPERT_PANEL_REVIEW.md`
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
16. `prompts/CODEX_START_PROMPT.md`

## Codex/IDE에 전달하는 방식
### 방식 A
- 이 문서 폴더 전체를 프로젝트 루트에 `docs/v2-blueprint`로 둔다.
- `prompts/CODEX_START_PROMPT.md`를 먼저 읽게 한다.
- 그 다음 문서를 순서대로 읽고 구현 계획부터 출력하게 한다.

### 방식 B
- 문서 폴더 전체를 업로드한다.
- 다음 지시를 함께 준다.
  - “문서를 순서대로 읽고, 구현 계획을 먼저 제시한 뒤 Epic 1부터 순차 구현하라.”
  - “문서에 없는 추정 구현은 하기 전에 명시하라.”
  - “폴더 구조와 계약을 먼저 만든 뒤 기능을 붙여라.”

## 문서 사용 규칙
- 문서 간 충돌이 있으면 상위 우선순위를 따른다.
  - 우선순위: `PRD > Extraction Spec > Evidence Contract > LLM Strategy > API/DB > Tasks`
- 문서에 없는 기능은 임의로 추가하지 않는다.
- `TODO-LATER`는 MVP 필수 범위가 아니다.
- 법무 문서는 템플릿이므로 실서비스 오픈 전 최종 검토가 필요하다.

## 구현 스타일
- 모놀리식 라우트 금지
- 자기 자신에게 HTTP 재호출 금지
- evidence 없는 핵심 이벤트 확정 금지
- OCR 원문 전체를 바로 최종 보고서로 보내는 방식 금지
- 프론트에서 직접 비즈니스 규칙 작성 금지
- 테스트 없는 핵심 추출 로직 머지 금지

## 구현 우선순위
1. 코어 데이터 계약
2. 날짜-이벤트 추출
3. evidence 저장 및 연결
4. 결과 렌더링
5. 인증/권한
6. 플랜/과금
7. 관리자
8. 법무/동의 정교화

## 이번 V2에서 반드시 고칠 V1 문제
- `/api/generate-report`가 내부 HTTP로 `/api/dna-report/generate`를 다시 호출하던 구조 제거
- 라우트 파일 안에 프롬프트/후처리/저장/보고서 렌더링이 뒤섞인 구조 제거
- stub 날짜 처리기 경로 제거
- evidence가 optional 이었던 구조를 required 계약으로 승격
- 출력 철학이 3개 이상 공존하던 상태를 `eventGraph → slotJSON → reportText`로 통일

## 최종 산출물
### 조사자용
- 파일 업로드
- OCR/이벤트 추출
- 10항목 보고서
- click-to-evidence
- 사용량/플랜/관리자

### 일반사용자용
- 파일 업로드
- 리스크 안내
- 정밀확인 업셀
- 전문가연결 요청

### 공통
- evidence graph
- event bundle
- slot JSON
- golden set test
- 최소 동의/약관 구조
