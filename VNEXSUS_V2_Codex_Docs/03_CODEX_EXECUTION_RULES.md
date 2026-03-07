# Codex / IDE 실행 규칙

## 목적
이 문서는 코더가 구현을 시작할 때 흔들리지 않도록 하는 실행 규칙 문서다.

## 1. 절대 규칙
### 1.1 도메인 우선
다음 순서를 절대 바꾸지 않는다.
1. 날짜-이벤트 추출
2. evidence 연결
3. slot JSON
4. 보고서 렌더링
5. 인증/플랜/과금
6. 관리자/결제

### 1.2 보험가입일 처리 규칙
- OCR 추출 금지
- 사용자가 입력하는 case metadata 로만 저장
- 보고서 재생성 시에도 입력 스냅샷을 유지

### 1.3 LLM 사용 규칙
- OCR 원문 전체를 바로 최종 보고서로 보내지 말 것
- LLM은 `Spot Resolver` 또는 `Case Helper`로만 사용할 것
- 중간 출력은 반드시 JSON
- evidence 없는 사실 확정 금지

### 1.4 evidence 규칙
핵심 이벤트는 아래 필수 필드를 가져야 한다.
- sourceFileId
- fileOrder
- pageOrder
- blockIndex 또는 bbox
- quote

### 1.5 라우팅 규칙
- 라우트는 얇게
- 비즈니스 규칙은 service/domain 으로 이동
- 자기 자신에게 HTTP 재호출 금지
- 프론트에서 핵심 비즈니스 규칙 작성 금지

## 2. 구현 순서 규칙
### Phase 0
- monorepo/folder skeleton
- env skeleton
- lint/test/format
- auth shell
- DB migration shell

### Phase 1
- file upload
- document/page/block schema
- OCR ingestion
- evidence registry

### Phase 2
- DateCandidate
- EventAtom
- EventBundle
- ambiguity scoring
- deterministic rules

### Phase 3
- Spot Resolver
- Case Helper
- slot assembler
- report renderer

### Phase 4
- investigator UX
- consumer UX
- plan gating
- usage ledger
- admin dashboard

### Phase 5
- export
- billing integration
- legal text fill
- analytics

## 3. 코드 생성 규칙
### 파일 생성
- 기능 추가 전에 계약(interface/schema/type)부터 만든다.
- 임의의 helper 파일을 루트에 만들지 않는다.
- `utils`는 재사용성이 입증된 경우에만 생성한다.
- 날짜/이벤트/증거 관련 로직은 반드시 `packages/domain` 안에 둔다.

### 타입 규칙
- 모든 핵심 계약은 zod 또는 동등한 runtime validation 을 가진다.
- `any` 금지
- OCR 응답, evidence, event, slot, report는 모두 명시적 타입 필요

### 테스트 규칙
- date parser
- date type classifier
- event bundler
- report slot assembler
- API validation
은 반드시 단위 테스트가 있어야 한다.

## 4. 금지 목록
- 라우트 파일 500줄 이상 금지
- 서비스 내부에서 fetch 로 자기 API 재호출 금지
- OCR 결과를 프론트 메모리에서만 유지 금지
- evidence 없는 event 노출 금지
- 보고서 생성 전에 slot JSON 생략 금지
- 역할별 권한 체크를 프론트에서만 처리 금지

## 5. 문서 우선순위 규칙
1. Master PRD
2. Date/Event Extraction Spec
3. Evidence Contract
4. LLM Strategy
5. Auth/Plans/Billing/Admin
6. DB/API
7. Tasks
8. Legal placeholders

## 6. 완료 정의(DoD) 공통 규칙
- 타입/스키마가 명확함
- API 요청/응답 계약이 문서와 일치함
- 최소 테스트 통과
- 로그/에러 메시지 구조가 있음
- 권한 검사가 있음
- UI는 실패 상태를 처리함
- golden set 1건 이상으로 검증함

## 7. 질문이 생겼을 때의 기본 행동
- 문서에 정의된 구조 안에서 해결한다.
- 추정 구현이 필요하면 먼저 `Assumption`으로 명시한다.
- 새 기능을 넣기 전에 기존 계약과 충돌하는지 확인한다.
- 구현보다 계약을 우선 수정한다.

## 8. 구현 산출물 형식
코더는 매 Phase 시작 시 아래 형식으로 답변한다.

```md
## Phase N 목표
## 구현 범위
## 생성/수정 파일 목록
## 계약 변경 여부
## 리스크
## 테스트 항목
```
