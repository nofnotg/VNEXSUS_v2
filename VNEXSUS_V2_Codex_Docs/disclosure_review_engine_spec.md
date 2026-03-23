# 고지의무 검토 엔진 스펙

## 목적

고지의무 검토는 별도 부가기능이 아니라 공통 분석 결과 위에 놓이는 핵심 분석 계층이다.

이 문서는 보험가입일 기준으로 candidate medical event를 분류하고, Starter와 Pro에서 어떻게 다르게 보여주는지 정의한다.

## 1. 보험가입일 처리 원칙

- `insuranceJoinDate`는 항상 user input case metadata 이다.
- OCR, PDF, 이미지, 문서의 문장 안에서 추정한 날짜를 보험가입일로 쓰지 않는다.
- 보험가입일이 없으면 deep disclosure-review는 제한 상태로 두고, 입력 필요 notice를 표시한다.

## 2. disclosure window 규칙

고지의무 window는 고정값으로 박지 않는다.

엔진은 configurable policy를 지원해야 한다.

예시:

- 3개월
- 1년
- 2년
- 5년
- 상품/운영정책에 따른 custom window

## 3. candidate medical event 분류 방식

공통 분석의 candidate event는 보험가입일과의 상대 위치로 분류된다.

예시 상대 분류:

- before_join
- within_3_months
- within_1_year
- within_2_years
- within_5_years
- outside_window
- unknown

## 4. candidate event tagging behavior

고지의무 검토 후보는 다음 조건을 바탕으로 태깅될 수 있다.

- event type
- canonical date
- 질환군 중요도
- diagnosis / pathology / admission / surgery / exam relevance
- evidence strength
- review-needed 여부

candidate type 예시:

- diagnosis
- exam
- admission
- surgery
- pathology
- follow_up
- other

## 5. Starter vs Pro 구분

### Starter = overview

Starter는 아래만 보여준다.

- join date 입력 여부
- 적용 가능한 window label
- 후보 개수
- 대표 후보 목록
- review-needed 개수
- “검토 후보 개요”라는 점을 명확히 하는 문구

Starter는 하지 않는 것:

- 최종 위반/비위반 판단
- window별 세부 reasoning 설명의 과도한 노출
- 복잡한 다문서 deep review

### Pro = deeper candidate review

Pro는 아래를 더 깊게 보여준다.

- 후보 이벤트별 근거 anchor
- 왜 candidate로 태깅됐는지
- 어떤 window에 상대적으로 걸리는지
- unresolved / insufficient evidence 여부
- 추가 확인이 필요한 이유

## 6. non-judgment wording

고지의무 검토 결과는 항상 비판단형 문구를 사용한다.

허용되는 표현:

- 검토 후보로 보입니다
- 추가 검토가 필요합니다
- 보험가입일 기준으로 확인이 필요합니다
- 근거가 충분하지 않아 확정할 수 없습니다

금지되는 표현:

- 고지의무 위반입니다
- 반드시 고지 대상입니다
- 지급 거절 사유입니다

## 7. 엔진 출력 구조 예시

```ts
type DisclosureReviewEngineOutput = {
  joinDateAvailable: boolean
  joinDate?: string
  windowPolicy: {
    policyId?: string
    label: string
    windowDefinitions: {
      name: string
      startOffsetDays?: number
      endOffsetDays?: number
    }[]
  }
  candidateEvents: {
    eventId: string
    eventType: string
    canonicalDate?: string
    relativeWindow: string
    candidateType: string
    candidateStrength: "strong" | "medium" | "weak"
    reviewNeeded: boolean
    evidenceRefs: EvidenceRefLite[]
  }[]
  engineNotice: string[]
}
```

## 8. future config fields 예시

향후 config 또는 persistence에서 필요한 필드 예시:

- `insuranceJoinDate`
- `disclosureWindowPolicyId`
- `windowDefinitions`
- `candidateEventType`
- `candidateStrength`
- `relativeWindow`
- `evidenceRefs`
- `reviewNeeded`
- `unresolvedReason`

## 9. 실무 출력 원칙

- 설계사는 먼저 overview를 본다.
- 복잡한 후보는 Pro에서 deeper review로 본다.
- candidate tagging은 “확정 판단”이 아니라 “검토 우선순위 표시”다.
- evidence가 약한 항목은 반드시 review-needed로 남긴다.
