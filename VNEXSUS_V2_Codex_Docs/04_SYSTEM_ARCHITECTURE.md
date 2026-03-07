# VNEXSUS V2 시스템 아키텍처

## 1. 원칙
- 하나의 앱, 역할별 UX 분기
- 하나의 이벤트 엔진, 플랜별 처리 수준 분기
- 업로드/저장/분석/렌더링/과금/권한을 분리
- OCR과 정밀분석은 별도 단계
- evidence graph를 모든 결과의 기반으로 사용

## 2. 권장 기술 스택
### 프론트엔드
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- PDF/Image viewer

### 백엔드 / API
- `apps/web` + `apps/worker` + `packages/*` 구조
- 핵심 도메인 로직은 `packages/domain`

### 데이터베이스
- PostgreSQL
- ORM: Prisma

### 큐 / 비동기 작업
- Redis + BullMQ 계열

### 스토리지
- S3 호환 스토리지 또는 Supabase Storage

### 인증
- Auth.js 또는 Supabase Auth
- 권장: 이메일/비밀번호 + magic link 우선

### 결제
- Stripe 구조로 설계 후 교체 가능하게 추상화

## 3. 모노레포 구조(권장)
```text
/apps
  /web
    /app
    /components
    /features
    /lib
  /worker
    /src/jobs
    /src/processors
/packages
  /domain
    /evidence
    /documents
    /ocr
    /dates
    /events
    /reports
    /plans
    /billing
    /auth
  /shared
    /types
    /utils
    /constants
  /prompts
  /config
  /ui
/docs
  /v2-blueprint
```

## 4. 논리 아키텍처
```text
[Web App]
  ├─ Auth & Onboarding
  ├─ Upload UI
  ├─ Investigator Workspace
  ├─ Consumer Workspace
  └─ Admin Console

[API Layer]
  ├─ Auth APIs
  ├─ Case APIs
  ├─ Document APIs
  ├─ OCR Job APIs
  ├─ Analysis APIs
  ├─ Report APIs
  ├─ Billing APIs
  └─ Admin APIs

[Async Workers]
  ├─ OCR Ingestion Worker
  ├─ Date/Event Extraction Worker
  ├─ Precision Analysis Worker
  ├─ Report Build Worker
  └─ Export Worker

[Domain Packages]
  ├─ Evidence Registry
  ├─ Date Candidate Engine
  ├─ Event Bundler
  ├─ Slot Assembler
  ├─ Report Renderer
  ├─ Usage Ledger
  └─ Consent Manager

[Infra]
  ├─ PostgreSQL
  ├─ Redis
  ├─ File Storage
  ├─ OCR Provider
  └─ LLM Provider
```

## 5. 역할별 UX 구조
### 공통
- 로그인
- 역할 선택
- 파일 업로드
- 처리 상태 확인
- 결과 열람

### 조사자
- 케이스 목록
- 환자/가입일 입력
- 보고서 탭
- 이벤트 탭
- evidence 뷰어
- export
- 사용량/플랜 상태

### 일반사용자
- 업로드
- 결과 요약
- 리스크 신호 카드
- 추가 분석 CTA
- 전문가연결 CTA

### 관리자
- 사용자 목록
- 역할/플랜/사용량 조정
- 실패 작업 모니터링
- 재시도
- 결제/구독 상태
- 전문가연결 요청 관리

## 6. 처리 파이프라인
1. 업로드
2. OCR
3. 전처리
4. 이벤트 추출
5. 정밀분석(선택적)
6. 보고서 생성
7. 저장/노출

## 7. 배포 단계
### 개발
- 로컬/스테이징
- 테스트용 API 키
- 더미 결제 모드

### 비공개 테스트
- 제한된 사용자
- 최소 동의 문서
- 로그/감사 저장

### 공개 오픈
- 민감정보 처리 문서 정식화
- 결제 활성화
- 관리자 모니터링
- 삭제/파기/권리행사 프로세스 준비
