# 설계사 MVP 빌드 우선순위

## 목적

이 문서는 현재 저장소 기준으로 설계사 대상 MVP를 만들 때 무엇을 먼저 만들어야 하는지 우선순위를 정리한다.

원칙:

- 코어 엔진을 다시 만들지 않는다.
- 이미 있는 엔진을 설계사 실무 흐름에 맞게 조립하는 일을 먼저 한다.
- 의료적 / 보험적 최종 판단은 계속 out of scope 로 둔다.

## 1. must build now

### 1. Starter 공통 분석 결과 조립 레이어

이유:

- 현재 엔진은 강하지만 출력이 아직 `consumer / investigator` 기준으로 남아 있다.
- 설계사 실무에서 필요한 Starter 결과는 새 공통 스키마와 Starter 스펙에 맞는 조립 레이어가 먼저 필요하다.

포함해야 하는 것:

- case basic info
- document inventory summary
- event timeline
- confidence / review-needed notice
- planner-friendly warning text

### 2. Starter 의료 이벤트 타임라인 + 대표 근거 노출

이유:

- 설계사가 가장 먼저 보는 것은 “언제, 어느 병원에서, 무슨 일이 있었는가”다.
- 현재 core bundles를 Starter timeline block으로 안전하게 보여주는 계층이 MVP 핵심이다.

포함해야 하는 것:

- 외래 / 입원 / 수술 / 검사 / 병리 / 응급 / follow-up 구분
- 대표 evidence anchor
- review-needed 표시

### 3. Starter 질환군 개요

이유:

- 설계사는 문서를 모두 읽기 전에 사건의 중심 질환군을 빨리 파악해야 한다.
- 암 / 심장 / 뇌혈관 / 수술 / 입원 / 만성질환군 개요는 현장 가치가 크다.

포함해야 하는 것:

- cluster present / not_found / review_needed
- 대표 근거 링크
- 과도한 해석 금지

### 4. Starter 고지의무 검토 개요

이유:

- 설계사 대상 제품에서 보험가입일 기준 검토 개요는 MVP 가치가 높다.
- deep review가 아니라 overview만 먼저 붙여도 실무 가치가 크다.

포함해야 하는 것:

- insuranceJoinDate 입력 여부
- candidate event count
- review-needed count
- 간단한 window summary
- 비판단형 문구

### 5. Starter compact summary / 공유 출력

이유:

- 설계사는 앱에서 본 결과를 내부 공유나 고객 응대 전 정리용으로 바로 꺼내야 한다.
- 기존 export 인프라가 있으므로 MVP에서 derived compact summary를 먼저 붙이는 것이 효율적이다.

## 2. should build next

### 6. Pro 심층 결과 조립

이유:

- slice1/2로 review signal은 이미 보강됐다.
- 다음 단계는 그 신호를 설계사 Pro 결과 구조로 조립하는 것이다.

### 7. Pro evidence drill-down 강화

이유:

- 현재 case-level evidence는 있으나 bundle-level drill-down은 placeholder가 있다.
- Pro에서는 “왜 이렇게 나왔는지”를 더 직접적으로 보여줘야 한다.

### 8. selective vision cross-check orchestration

이유:

- Pro의 핵심 차별점 중 하나지만, Starter MVP보다 먼저 붙일 필요는 없다.
- ambiguity 기반 selective execution으로 제한해야 한다.

### 9. Pro 질문 / 검색의 최소 버전

이유:

- Pro 가치를 높이는 기능이지만, core Starter 결과가 정렬된 뒤에 붙여야 한다.
- 처음부터 자유 채팅보다는 evidence-grounded 질의 범주부터 좁게 시작하는 편이 안전하다.

## 3. later / productization layer

### 10. planner-auth 재정렬

- planner / admin 역할 정리
- sign-up payload 단순화
- 기존 consumer / investigator 구조 정리

### 11. Google / Kakao social login

- 제품화에는 중요하지만 분석 결과 MVP보다 후순위다.

### 12. billing / subscription / entitlement

- Plan/Subscription DB 구조는 있으나 실제 결제와 entitlement는 productization 층이다.

### 13. 운영/관리 polish

- admin polishing
- release workflow
- 고객-facing commercial packaging

## 추천 빌드 순서

1. Starter 공통 분석 결과 조립
2. Starter timeline + evidence anchor
3. Starter 질환군 개요
4. Starter 고지의무 검토 개요
5. Starter compact summary / export
6. Pro 심층 결과 조립
7. Pro evidence drill-down
8. selective vision cross-check orchestration
9. Pro 질문 / 검색 최소 버전
10. auth / social login / billing / entitlement

## 왜 이 순서가 맞는가

- 설계사는 먼저 Starter 한 화면에서 사건을 이해해야 한다.
- 현재 엔진은 그 재료를 이미 많이 갖고 있다.
- 따라서 MVP의 병목은 extraction이 아니라 planner-facing output assembly다.
- Pro, 로그인, billing은 그 다음에 붙여도 된다.

## 명시적 비범위

아래는 MVP 우선순위 밖이다.

- 보험금 지급 / 거절 최종 판단
- 의료적 확정 진단
- broad productization
- 소셜 로그인 실제 구현
- 실제 결제 구현
- 자유형 Pro 채팅의 조기 확장
