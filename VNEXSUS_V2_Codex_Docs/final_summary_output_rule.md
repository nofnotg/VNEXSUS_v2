# 최종 요약 / export 출력 규칙

## 목적

최종 요약본은 앱의 공통 분석 결과와 Starter/Pro 상세 결과에서 파생되는 compact export 출력이다.

이 문서는 “최종 요약본이 무엇을 담고, 무엇을 담지 않는지”를 정의한다.

## 핵심 원칙

- 최종 요약본은 derived output 이다.
- 앱의 전체 identity를 최종 요약본 하나로 축소하지 않는다.
- detailed analysis를 대체하지 않는다.
- evidence 기반 분석 결과를 compact하게 재배열하는 역할만 한다.

## 앱 분석과 export summary의 관계

- 앱 내부 분석 결과가 source of truth 다.
- export summary는 공통 분석 결과에서 필요한 섹션만 추린다.
- Starter export와 Pro export는 깊이가 다를 수 있지만 구조 원칙은 동일하다.

## 최소 필수 섹션

### 1. 사건 개요
- 보험가입일 입력 여부
- 분석 대상 문서 수
- 사건의 핵심 의료 흐름 요약

### 2. 날짜 중심 핵심 타임라인
- 주요 날짜
- 병원
- 이벤트 유형
- 짧은 핵심 내용

### 3. 진단 / 질환 개요
- 핵심 진단 또는 질환군
- 검토 필요 여부

### 4. 검사 / 병리 / 치료 / 수술 요약
- 중요한 검사
- 주요 병리 결과
- 수술 / 시술 / 치료 요점

### 5. 외래 / 입원 요약
- 통원 흐름
- 입원 기간
- 당일 입원 처리 필요 시 반영

### 6. 의견 / 주의 요약
- review-needed
- unresolved
- source quality warning
- 판단 금지 문구

## 구조 규칙

### 날짜
- canonicalDate 기준
- 불확실하면 review-needed 표시

### diagnosis
- 진단명은 evidence가 연결된 범위에서만 노출
- 확정 진단처럼 과도하게 단정하지 않는다

### exam
- 검사명과 결과는 가능한 한 pair로 요약
- 결과가 약하면 clean sentence로 확정하지 않는다

### pathology
- 병리 / 조직검사는 암 관련 사건에서 중요하게 유지
- 원문 근거가 있는 경우에만 강하게 요약

### treatment / surgery
- 치료, 시술, 수술은 별도 요약 항목으로 유지
- 사건 흐름을 이해하는 데 필요한 정도로 압축

### admission / outpatient
- 외래와 입원은 반드시 분리
- 입원 기간과 통원 흐름을 섞지 않는다

### opinion summary
- 의사소견 또는 검토 의견이 있을 경우 짧게 요약
- 단, 시스템이 최종 판단을 내린 것처럼 쓰지 않는다

## 암 관련 pathology / TNM-like detail 노출 규칙

아래 조건에서만 더 자세한 암 관련 요약을 포함할 수 있다.

- 암 관련 cluster가 present 또는 review_needed
- 병리 / 조직검사 evidence가 존재
- 보고일 / 진단일 / 확진 근거가 일정 수준 이상 정리됨

포함 가능한 항목:

- 병리 결과 핵심 표현
- 보고일 / 진단일 / 확진 근거
- 원발 / 전이 관련 핵심 메모
- TNM-like detail 이 근거와 함께 있을 때만 제한적으로 포함

근거가 약하면:

- “검토 필요”로 남긴다
- detailed view로 유도한다

## compact 유지 vs detailed view 위임 규칙

최종 요약본은 다음 조건에서 compact를 유지한다.

- 사건의 핵심 흐름이 명확한 경우
- review-needed 수가 제한적인 경우
- Planner가 1차 설명에 필요한 수준이면 충분한 경우

다음 조건에서는 Starter/Pro 상세 보기로 위임한다.

- review-needed 또는 unresolved가 많은 경우
- 병리 / 수술 / 입원 / 고지의무 후보가 복잡하게 얽힌 경우
- 근거 drill-down이 필요한 경우
- 질문형 탐색이 필요한 경우

## 필수 경고 원칙

- 본 요약은 의료적 최종 진단이 아니다.
- 본 요약은 보험금 승인 / 거절 판단이 아니다.
- 문서 품질, 누락, OCR 편차가 결과에 영향을 줄 수 있다.
