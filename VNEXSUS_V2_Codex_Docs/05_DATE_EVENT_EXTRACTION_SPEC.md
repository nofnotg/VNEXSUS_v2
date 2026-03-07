# 날짜-이벤트 추출 설계서 v1

## 1. 목적
이 문서는 VNEXSUS V2의 핵심 엔진인 날짜-이벤트 추출 파이프라인을 정의한다.

## 2. 핵심 문제
의료문서에는 날짜가 많다. 하지만 모든 날짜가 사건의 중심은 아니다.

### 구분해야 할 날짜
- 실제 내원일
- 검사 시행일
- 결과 설명일
- 병리 보고일
- 수술일
- 입원일
- 퇴원일
- 예약/추적관찰 예정일
- 과거력 언급일
- 문서 발급일
- 서류 출력일
- 타병원 참조일

목표는 보이는 날짜를 모두 잡는 것이 아니라, 의미 있는 날짜를 중심으로 사건을 복원하는 것이다.

## 3. 처리 철학
`Raw OCR → DateCandidate → EventAtom → EventBundle → Slot JSON → Report`

## 4. 입력
### 입력 원천
- 업로드된 의료문서 파일
- OCR block 결과
- 파일 순서(fileOrder)
- 페이지 순서(pageOrder)
- 보험가입일(case metadata)

### 비입력
- 보험금 청구서 OCR
- 심사평가원 서류 OCR
- 가입일 OCR 추정
- 약관 OCR 해석

## 5. 핵심 데이터 구조
### DateCandidate
```ts
type DateCandidate = {
  id: string
  sourceFileId: string
  fileOrder: number
  pageOrder: number
  blockIndex: number
  rawDateText: string
  normalizedDate: string | null
  localText: string
  contextBefore?: string
  contextAfter?: string
  dateTypeCandidate?: "visit" | "exam" | "result" | "pathology" | "surgery" | "admission" | "discharge" | "plan" | "history" | "admin" | "irrelevant"
  confidence: number
}
```

### EventAtom
```ts
type EventAtom = {
  id: string
  date: string | null
  eventType: "visit" | "exam" | "result" | "pathology" | "surgery" | "admission" | "discharge" | "prescription" | "followup" | "history"
  hospital?: string
  department?: string
  diagnosisCandidates: DiagnosisCandidate[]
  examCandidates: ExamCandidate[]
  treatmentCandidates: TreatmentCandidate[]
  sourceEvidenceIds: string[]
  confidence: number
}
```

### EventBundle
```ts
type EventBundle = {
  id: string
  canonicalDate: string
  hospital?: string
  eventFamily: "outpatient" | "inpatient" | "surgery" | "major_exam" | "pathology" | "followup"
  relatedAtomIds: string[]
  diagnoses: Diagnosis[]
  examinations: Examination[]
  treatments: Treatment[]
  doctorOpinion?: string
  pastHistory?: string[]
  evidenceIds: string[]
  ambiguityScore: number
}
```

## 6. 파이프라인 단계
### A — OCR 블록 정규화
- fileOrder 유지
- pageOrder 유지
- blockIndex 생성
- bbox 저장
- raw/normalized text 저장

### B — 날짜 후보 추출
- 정규식으로 모든 날짜 후보 탐지
- OCR 오인식 보정
- 비현실 날짜 필터

### C — 허수 날짜 1차 제거
`irrelevant` 처리 후보:
- 문서 출력일/인쇄일
- 단순 접수번호 옆 날짜
- 반복 머리글/꼬리글 날짜
- 양식 발행일
- 보험 청구 관련 날짜
- 참고용 타기관 문서 발행일

### D — 날짜 유형 판정
분류값:
- visit
- exam
- result
- pathology
- surgery
- admission
- discharge
- plan
- history
- admin
- irrelevant

판정 순서:
1. 규칙/키워드 1차
2. 충돌 시 spot resolver

### E — 엔티티 추출
- 병원명
- 진단명
- KCD/ICD 코드
- 검사명
- 치료/수술명
- 의사소견
- 입원/통원 기간

### F — EventAtom 생성
- 날짜와 로컬 컨텍스트를 기준으로 사건 원자 생성
- sourceEvidenceIds 필수

### G — EventBundle 생성
묶기 기준:
- 같은 병원
- 같은 날짜 또는 강한 연결성
- 같은 진료 흐름
- 검사/결과/설명/치료의 논리적 연결

묶으면 안 되는 경우:
- 검사 시행일과 결과 설명일이 별도 사건인 경우
- 타병원 참조와 현재 내원이 다른 경우
- 과거력 서술이 현재 사건에 흡수되는 경우

### H — ambiguity score 계산
점수 상승 조건:
- 날짜 2개 이상 충돌
- visit/result/exam 구분 모호
- 병원 2개 이상 혼재
- 과거력 가능성 높음
- evidence가 약함
- OCR confidence 낮음

활용:
- 정밀분석 추천
- 자동 spot resolver 호출
- 사람 검토 큐 판단

### I — Slot JSON 생성
#### 조사자용 10항목
1. 내원일시
2. 내원경위
3. 진단병명
4. 검사결과
5. 수술후조직검사
6. 치료내용
7. 통원기간
8. 입원기간
9. 과거병력
10. 의사소견

#### 일반사용자용
- 주요 날짜
- 병원
- 핵심 이력
- 검토 필요 신호
- 추가 확인 포인트

## 7. KCD/ICD 표기 원칙
- 가능하면 `영문 원어 (코드) — 한글 병명`
- 코드만 있고 병명 없으면 코드 우선
- 병명만 있고 코드 없으면 병명 우선
- 확정되지 않은 경우 추정 표기 금지

## 8. 오류 처리
- 날짜 파싱 실패: 후보 유지
- 날짜 유형 불명: ambiguityScore 증가
- evidence 부족: `requiresReview`
- bundle 실패: atom 단위 fallback

## 9. 수락 기준
- 핵심 이벤트 95% 이상 evidence 보유
- 허수 날짜 주요 오탐률 감소
- visit/exam/result 구분 정확도 향상
- 보고서 슬롯 누락률 감소
- golden set에서 날짜 순서와 핵심 병원/진단 일치
