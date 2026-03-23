# 가입 / 소셜 로그인 / 결제 정책 메모

## 목적

이 문서는 설계사 대상 앱 기준으로 가입, 소셜 로그인, 결제 방향을 정리한다.

## 가입 기본 원칙

- 가입은 최대한 단순해야 한다.
- 초기 기본 입력은 `이름 + 이메일` 중심으로 설계한다.
- 비밀번호 또는 magic link 는 구현 선택지로 열어둔다.

## 소셜 로그인 우선순위

1. Google OAuth
2. Kakao OAuth
3. 기타 provider 는 later option

## 기본 역할

- `planner`
- `admin`

초기 기본 유저는 planner 이다.

## 플랜 구조

- `Starter`
- `Pro`

Studio, consumer tier, expert connection tier 는 현재 기본 활성 상품 구조가 아니다.

## 결제 방향

- Starter / Pro entitlement 를 기준으로 결제 구조를 설계한다.
- 결제 시스템은 Stripe 같은 provider 를 추상화 가능한 구조로 둔다.
- 가격 숫자는 later decision 이지만, 문서상 지원해야 할 상태는 지금부터 고정한다.

필요 상태:

- 현재 플랜
- 구독 활성/비활성
- 결제 이력
- 업그레이드 이력

## 현재 단계 주의

- productization 은 아직 코어 엔진보다 후순위다.
- 이 문서는 구현 지시가 아니라 방향 정렬 문서다.
- 실제 결제 코드보다 entitlement / auth / plan contract 정리가 먼저다.
