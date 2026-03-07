# Epic / Task / Delivery Plan

## Phase 0 — 기초 구조
### Epic 0.1 모노레포 초기화
- apps/web 생성
- apps/worker 생성
- packages/domain/shared/prompts/config 생성
- lint/format/test 설정
- env.example 작성

### Epic 0.2 인증 뼈대
- 회원가입/로그인 화면
- role 선택
- session 유지
- route protection 기본 구현

## Phase 1 — 업로드/OCR/evidence
### Epic 1.1 케이스 및 문서 업로드
- case CRUD
- patient input form
- document upload
- fileOrder 관리

### Epic 1.2 OCR ingestion
- OCR provider adapter
- page split
- ocr_blocks 저장
- bbox 저장
- job status 저장

### Epic 1.3 evidence registry
- source_documents / source_pages / ocr_blocks / evidence_refs schema
- evidence query API
- page jump helper

## Phase 2 — 날짜-이벤트 추출
### Epic 2.1 DateCandidate 추출
- 날짜 regex/normalizer
- 허수 날짜 1차 분류
- date_candidates 저장

### Epic 2.2 엔티티 추출
- hospital dictionary
- diagnosis/exam/treatment 후보 추출
- ICD/KCD 패턴 추출

### Epic 2.3 EventAtom 생성
- date-centered window 구성
- atom builder
- sourceEvidenceIds 연결

### Epic 2.4 EventBundle 생성
- bundling heuristic
- ambiguity score 계산
- review flags 생성

## Phase 3 — 정밀분석 / LLM
### Epic 3.1 Spot Resolver
- prompt template 구현
- provider adapter 구현
- JSON parsing / validation
- retry / fallback

### Epic 3.2 Case Helper
- bundle conflict resolver
- slot completeness enhancer
- unresolved flagger

### Epic 3.3 Plan gating
- 미리확인/Starter에서는 자동 실행 금지
- 정밀확인/Pro 이상만 허용
- 예상 차감량 계산

## Phase 4 — 결과 렌더링
### Epic 4.1 Slot Assembler
- investigator slot JSON 10항목 생성
- consumer summary slot 생성

### Epic 4.2 Report Renderer
- 조사자용 텍스트/HTML 보고서
- 일반사용자 요약 카드
- evidence link binding

### Epic 4.3 click-to-evidence UI
- PDF/image viewer
- page jump
- bbox highlight
- quote/context panel

## Phase 5 — 플랜 / 과금 / 관리자
### Epic 5.1 플랜/사용량
- plan table
- subscription table
- usage ledger
- usage gating
- 예상 차감량 UI

### Epic 5.2 관리자페이지
- 사용자 조회/상태 변경
- 실패 job 조회/재시도
- 사용량/결제 조회

### Epic 5.3 전문가연결
- connection request 생성
- 관리자 조회
- 상태 업데이트

## Phase 6 — 결제 / 약관 / 오픈 준비
### Epic 6.1 결제 연동
- subscription checkout
- one-time upgrade checkout
- webhook
- billing status sync

### Epic 6.2 동의/약관 골격
- terms/privacy pages
- consent checkboxes
- consent version storage

### Epic 6.3 오픈 점검
- 삭제/파기 기본 정책
- 문의 경로
- error logging
- basic analytics

## 병행 가능하지만 우선순위 낮은 항목
- 판례/약관 검색 고도화
- 팀 협업 상세 기능
- 대량 batch 업로드 개선
- 전문가 매칭 자동화
- RAG 심화

## 각 Phase 종료 시 산출물
- 설계 반영 여부 체크리스트
- DB migration
- API 구현
- UI 구현
- 테스트 결과
- 데모 경로
- 남은 리스크
