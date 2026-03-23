# 제품 방향 Realign 메모

## 목적

이 문서는 2026-03-23 기준으로 VNEXSUS V2의 제품 방향을 다시 고정하는 canonical memo 이다.

이 메모는 기존 문서의 일부 이원 구조를 `설계사 단일 타깃 + Starter / Pro` 방향으로 재해석하는 기준이다.

## 한 줄 정의

VNEXSUS V2는 설계사가 고객의 보험금청구 건을 검토할 때 쓰는 의료문서 분석 앱이다.

## 바뀐 점

### 예전 기본 해석

- 일반사용자용 결과
- 조사자용 결과
- consumer / investigator 이원 구조

### 지금 기준

- 설계사 단일 타깃
- Starter / Pro 상품 구조
- 코어 엔진 하나를 기반으로 한 분석 결과 체계
- 보고서는 파생 산출물

## 그대로 유지되는 것

- 날짜-이벤트 추출 중심 엔진
- evidence linkage
- insuranceJoinDate 는 user input metadata
- weak evidence 를 review-needed 로 남기는 안전장치
- productization 보다 코어 엔진 우선

## 새로 문서에 명확히 반영해야 하는 것

- Starter 기능 경계
- Pro 기능 경계
- 설계사 관점의 사건 개요와 고지의무 검토 개요
- 간편 가입 + 소셜 로그인 정책
- 결제 / 구독 방향

## 문서 해석 우선순위

이 메모와 예전 문서가 충돌하면, 아래 순서로 해석한다.

1. `medical_app_realign_plan_2026-03-23.md`
2. `17_PRODUCT_DIRECTION_REALIGN.md`
3. `18_STARTER_PRO_PRODUCT_MAP.md`
4. `19_SIGNUP_SOCIAL_LOGIN_AND_BILLING_POLICY.md`
5. 기존 PRD / auth / epic 문서

## 제품 언어 원칙

- 앱은 “판단”보다 “분석과 정리”를 제공한다.
- 앱은 보험사/의사/손해사정사의 최종 판단을 대체하지 않는다.
- Starter 는 현장 1차 분석 도구다.
- Pro 는 상위 검증과 심층 탐색 도구다.
