# Click-to-Evidence 데이터 계약서 v1

## 1. 목적
이 문서는 VNEXSUS V2의 모든 결과가 근거를 추적할 수 있도록 하는 evidence 계약을 정의한다.
evidence가 없는 결과는 신뢰할 수 없는 결과다.

## 2. 기본 원칙
1. evidence는 optional 이 아니라 core contract 이다.
2. 핵심 이벤트는 최소 1개 이상의 evidence를 가져야 한다.
3. 보고서 문장/슬롯/카드와 evidence는 연결 가능해야 한다.
4. file/page 기준은 문서 내부 표기 페이지가 아니라 업로드 순서 기준이다.
5. OCR 블록 좌표는 가능한 한 원본 그대로 보존한다.

## 3. 핵심 객체
### SourceDocument
```ts
type SourceDocument = {
  id: string
  caseId: string
  originalFileName: string
  fileOrder: number
  mimeType: string
  storagePath: string
  pageCount: number
}
```

### SourcePage
```ts
type SourcePage = {
  id: string
  sourceFileId: string
  pageOrder: number
  imagePath?: string
  width?: number
  height?: number
}
```

### OcrBlock
```ts
type OcrBlock = {
  id: string
  sourceFileId: string
  pageId: string
  fileOrder: number
  pageOrder: number
  blockIndex: number
  textRaw: string
  textNormalized: string
  bbox: { xMin: number; yMin: number; xMax: number; yMax: number }
  confidence?: number
}
```

### EvidenceRef
```ts
type EvidenceRef = {
  id: string
  sourceFileId: string
  pageOrder: number
  blockIndex: number
  bbox?: { xMin: number; yMin: number; xMax: number; yMax: number }
  quote: string
  contextBefore?: string
  contextAfter?: string
  confidence?: number
}
```

## 4. 연결 대상
- DateCandidate
- EventAtom
- EventBundle
- ReportSlot
- ReportSentence (선택)
- ReviewFlag

## 5. 프론트 UX 계약
### 조사자용
- 보고서의 날짜 또는 항목 클릭
- 해당 파일/페이지 자동 이동
- bbox 하이라이트
- quote 및 주변 문맥 패널 표시

### 일반사용자용
- 주요 날짜/핵심 이력 카드 클릭
- 관련 페이지 링크 제공
- 문맥 quote 표시
- 필요 시 쉬운 설명 추가

## 6. 필수 필드
핵심 이벤트가 가질 evidence는 최소한 다음을 충족해야 한다.
- sourceFileId
- fileOrder
- pageOrder
- quote
- blockIndex 또는 bbox

## 7. fallback 규칙
- bbox가 없으면 blockIndex + pageOrder + quote
- blockIndex도 없으면 pageOrder + quote
- 둘 다 없으면 핵심 이벤트로 확정하지 않는다

## 8. 렌더링 규칙
### 조사자
- slot마다 `evidenceRefs[]`
- 대표 evidence 1개 + 추가 evidence 펼치기

### 일반사용자
- 리스크 카드마다 대표 evidence 1개
- 추가 evidence는 정밀확인 또는 상세 보기에서 노출

## 9. 저장 규칙
- OCR block는 원본/정규화 텍스트 모두 저장
- evidence quote는 원문 일부를 그대로 보존
- 과다 노출 우려 시 quote 길이 제한
- export 시 내부 식별자 제외 가능

## 10. 성능 규칙
- pageOrder 기반 점프는 1초 이내
- evidenceRef 조회는 indexed query 사용
- case 단위 evidence index 사전 생성

## 11. 수락 기준
- 조사자용 핵심 이벤트 95% 이상 evidence 연결
- click-to-evidence 동작 성공률 99% 이상
- quote 누락 또는 잘못된 page 점프는 bug 분류
