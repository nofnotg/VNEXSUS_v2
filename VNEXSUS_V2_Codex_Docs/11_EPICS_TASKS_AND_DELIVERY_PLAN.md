# Epic / Task / Delivery Plan

## 현재 방향 요약

현재 개발은 “설계사가 쓰는 의료문서 분석 앱” 기준으로 재정렬되어야 한다.

이미 상당히 진척된 것은 코어 엔진이다.

- 날짜-이벤트 추출
- evidence linkage
- structured output
- weak evidence review signal

아직 제품 문서와 후속 구현이 필요한 것은 다음이다.

- Starter / Pro 결과 체계
- planner-facing UX 구조
- 로그인 / 소셜 로그인
- 결제 / 구독
- Pro 질문 / 검색 / selective vision 운영 구조

## Epic 0 — 문서/계약 realign

- 설계사 단일 타깃 방향 정리
- Starter / Pro 상품 문서 정리
- auth / social login / billing 정책 정리
- 기존 consumer / investigator 문서 흔적 정리

## Epic 1 — 코어 수집과 evidence 기반

- 파일 업로드
- OCR ingestion
- evidence registry
- source file / page / block 연결

## Epic 2 — 날짜-이벤트 구조화 엔진

- DateCandidate 추출
- entity 추출
- EventAtom 생성
- EventBundle 생성
- weak evidence / ambiguity gating

## Epic 3 — 보험가입일 기준 분석 확장

- 보험가입일 metadata 입력
- 가입 전/후 타임라인 정렬
- 고지의무 구간 rule configuration
- 후보 진료 태깅

## Epic 4 — Starter 결과 체계

- 사건 개요
- 의료 이벤트 시계열
- 질환군별 개괄
- 고지의무 검토 개요
- 주의사항 / 판단 금지 안내
- 기본 공유용 리포트

## Epic 5 — Pro 심층 분석 체계

- selective vision cross-check
- 근거 drill-down 강화
- 질문 / 검색 / 재질문
- 질환군별 상세 정리
- 심층 리포트

## Epic 6 — 로그인 / 소셜 로그인 / 플랜 / 결제

- 이름 / 이메일 중심 간편 가입
- Google OAuth 우선
- Kakao OAuth later option
- Starter / Pro entitlement
- billing / subscription skeleton

## Epic 7 — 관리자와 운영

- 사용자 상태 조회
- 작업 실패건 관리
- 구독 / 결제 상태 관리
- 지원 / 운영 로그 관리

## Epic 8 — export / release readiness

- Starter 리포트 export
- Pro 리포트 export
- 운영/법무/동의 최소 구조
- 배포 전 체크리스트

## 구현 우선순위 원칙

1. 코어 엔진 안정화
2. Starter 분석 체계
3. Pro 심층 분석 체계
4. auth / social login / billing
5. admin / export / release

## 항상 지켜야 할 보호 조건

- `Case3` 는 watch-only 로 유지
- `Case10` 보호된 stable improved 상태 유지
- `Case36` cleared-blocker 상태 유지
- date-extraction 보호 파일은 함부로 건드리지 않음
- productization 기능은 코어 엔진보다 먼저 붙이지 않음
