# 인증 / 역할 / 플랜 / 과금 / 관리자 정책 v2

## 1. 역할 정의

### planner

설계사 또는 설계사 실무 보조 사용자.

이 앱의 기본 사용자 역할이다.

- 고객 보험금청구 건 분석
- Starter / Pro 결과 확인
- 문서 업로드 및 케이스 관리
- evidence 확인
- 고지의무 검토 포인트 파악

### admin

운영 및 관리 역할.

- 사용자 관리
- 플랜/구독/결제 관리
- 실패건/지원건 관리
- 시스템 운영 점검

현재 기본 제품 역할은 `planner` 와 `admin` 두 가지로 본다.

## 2. 회원가입 흐름

### 기본 원칙

- 회원가입은 최대한 간단해야 한다.
- 초기 기본 입력은 `이름 + 이메일` 중심으로 설계한다.
- 비밀번호 또는 magic link 구조를 선택할 수 있어야 한다.
- 이후 소셜 로그인 연동을 붙일 수 있어야 한다.

### 초기 우선 정책

- 이메일 기반 가입
- 이름 입력
- 필수 약관/개인정보/민감정보 동의
- planner 기본 role 부여

### 소셜 로그인 방향

- 우선 고려: `Google OAuth`
- 국내 사용자 확장 시 고려: `Kakao OAuth`
- 추가 OAuth provider 는 later option

## 3. 플랜 구조

### Starter

- 기본 OCR 분석
- 핵심 이벤트 시계열
- 질환군 개괄
- 고지의무 검토 개요
- 기본 리포트 출력
- 정확도/편차/검토필요 안내

### Pro

- Starter 전체 포함
- selective vision cross-check
- 더 깊은 질환군별 정리
- 질문 / 검색 / 재질문
- evidence drill-down 강화
- 심층 리포트

## 4. Entitlement 방향

Starter 와 Pro 는 다음 entitlement 차이를 가진다.

### Starter

- 기본 분석 결과
- 기본 공유용 리포트
- 제한된 deep inspection

### Pro

- selective vision 기반 상위 검증
- 더 많은 evidence drill-down
- 질의응답 / 검색
- 더 상세한 분석 결과와 리포트

정확한 가격은 아직 확정하지 않지만, entitlement 구조는 문서상 지금부터 분리한다.

## 5. 결제 방향

### 결제 구조 원칙

- productization은 아직 구현 우선순위의 맨 앞이 아니다.
- 하지만 Starter / Pro 접근 제어를 위해 billing 구조는 문서상 준비되어야 한다.
- Stripe 같은 외부 결제 시스템을 추상화 가능한 구조로 설계한다.

### 현재 정책 초안

- Starter
  - base tier
  - trial 또는 저가 entry tier 가능
- Pro
  - subscription 또는 상위 분석 패스 형태

정확한 가격 정책은 later decision 이지만, 시스템은 최소한 다음을 지원해야 한다.

- 현재 플랜 상태
- 결제 이력
- 구독 활성/비활성
- 업그레이드 이력

## 6. 관리자 기능

### 사용자 관리

- 사용자 목록
- 가입 상태
- 플랜 상태
- 결제 상태
- 지원 이력

### 작업 관리

- OCR / 분석 작업 상태 확인
- 실패건 조회
- 재처리 판단 보조

### 과금 관리

- 구독 상태
- 결제 이력
- 업그레이드 / 다운그레이드 기록

## 7. 권한 원칙

- planner 는 자신의 케이스만 접근 가능
- admin 만 운영 관리 화면 접근 가능
- productization 이전에는 과금 기능이 실제 결제보다 entitlement gating 준비 수준에 머물 수 있다

## 8. 현재 문서 해석 주의

예전 문서에는 `consumer / investigator / admin` 구조와 `미리확인 / 정밀확인 / 전문가연결 / Starter / Pro / Studio` 구조가 남아 있을 수 있다.

현재 제품 방향에서는 그 구조를 다음처럼 치환해서 읽는다.

- `consumer` → 폐기된 과거 방향
- `investigator` → 현재의 planner-facing core analysis 흐름으로 흡수
- `Starter / Pro / Studio` 중 실제 활성 제품 정의는 `Starter / Pro`
- `전문가연결` 은 별도 funnel 이 아니라 later option

## 9. 절대 금지

- planner 사용자에게 의료적/보험적 최종 판단을 앱이 내리는 것처럼 설명하지 말 것
- 보험가입일을 OCR 데이터처럼 다루지 말 것
- role 복잡도를 productization 전에 과도하게 키우지 말 것
