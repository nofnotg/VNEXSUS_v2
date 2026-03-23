# Pro 심층 분석 스펙

## 목적

Pro는 Starter 결과를 더 깊게 검증하고, 설계사가 복잡한 사건을 근거 중심으로 탐색할 수 있게 하는 심층 분석 층이다.

Starter가 “1차 사건 파악”이라면, Pro는 “왜 이렇게 분류됐는지와 어디를 더 확인해야 하는지”를 설명하는 층이다.

## Pro가 Starter에 더하는 것

### 1. selective vision cross-check
- 전체 문서 전면 재처리가 아니라, ambiguity가 높은 페이지/블록만 선택적으로 교차 검증
- OCR-only 결과의 약한 부분을 상위 검증

### 2. 질환군별 더 깊은 분석
- 암 / 심장 / 뇌혈관 / 수술 / 입원 / 만성질환군별로
- 중요한 검사, 병리, 입원, 수술 이벤트를 더 깊게 설명

### 3. stronger evidence drill-down
- 결과 섹션에서 대표 근거뿐 아니라 추가 evidence anchor까지 더 쉽게 확인
- 왜 review-needed인지 설명 가능해야 함

### 4. 질문 / 검색 / follow-up question
- 사건 안에서 특정 판단 근거를 다시 묻고 탐색
- 단, 모든 답변은 evidence-grounded 이어야 함

### 5. 고지의무 후보 심층 검토
- 후보 이벤트가 왜 window 안에 들어오는지
- 어떤 문서/페이지가 근거인지
- 어떤 부분이 unresolved인지

## Pro의 핵심 역할

- “왜 이렇게 분류됐는가”를 설명한다.
- “원문 근거가 어디 있는가”를 더 깊게 보여준다.
- “추가 검토가 필요한 부분이 무엇인가”를 드러낸다.
- 심층 검토를 하더라도 final judgment를 하지 않는다.

## selective vision cross-check 역할

Pro의 selective vision cross-check는 다음 역할에 한정한다.

- ambiguity가 높은 page/block 재검토
- OCR 해석이 불안정한 검사/병리/수술 근거 보완
- 날짜/검사/결과 pairing의 불확실성 보강

제한:

- 전체 문서 무차별 vision 재처리는 기본 동작이 아니다.
- 교차 검증은 “근거를 더 강하게 보여주기 위한 보강”이지, 임의 재서술 도구가 아니다.

## deeper disease-group interpretation 역할

Pro는 질환군별로 더 구체적인 분석을 제공할 수 있다.

예시:

- 암: 병리보고, 보고일, 진단일, 확진 근거, TNM-like 정보
- 심장: 검사명, 시술 여부, 협착/관상동맥 관련 핵심 포인트
- 뇌혈관: 주요 영상검사, 병변 위치 / 범위 관련 핵심 포인트
- 수술/입원: 입퇴원 기간, 수술 전후 핵심 사건 연결

주의:

- 이런 설명도 evidence-grounded 이어야 한다.
- 의료적 최종 판정처럼 단정하지 않는다.

## question / search / follow-up role

Pro 질문 기능은 “설명형 검증” 도구다.

허용되는 질문 범주:

- 왜 이렇게 분류됐는가
- source evidence가 어디에 있는가
- 이것이 고지의무 검토 후보처럼 보이는가
- 추가로 무엇을 검토해야 하는가

허용되지 않는 질문 방향:

- 지급/부지급을 최종 확정해 달라
- 의료적 최종 진단을 내려 달라
- evidence 없이 추정 결론만 말해 달라

## evidence-grounded answer 원칙

Pro 답변은 다음을 따라야 한다.

- 가능한 경우 event / evidence anchor를 명시한다.
- 답변 근거가 약하면 review-needed 또는 unresolved로 남긴다.
- 답변이 파생 추론이면 그것을 사실 확정처럼 말하지 않는다.

## unresolved / ambiguous findings 처리

Pro는 약한 부분을 숨기지 않는다.

표시 원칙:

- review_required
- insufficient_evidence
- conflicting_signals
- source_quality_limited

이 상태는 질문 답변과 narrative에도 그대로 반영돼야 한다.

## Pro도 여전히 하지 않는 것

- 의료적 최종 진단
- 보험금 승인 / 거절 최종 판단
- 법률적 확정 해석
- evidence 없는 확정 서술

## valid Pro question categories 예시

### 왜 이렇게 분류됐는가
- 이 이벤트가 입원으로 묶인 이유는 무엇인가
- 이 사건이 암 관련 cluster로 들어간 이유는 무엇인가

### source evidence가 어디에 있는가
- 이 병리 결과의 원문 근거는 어느 페이지인가
- 이 수술 이벤트를 뒷받침하는 문서는 무엇인가

### disclosure-review candidate 여부
- 이 기록은 보험가입일 기준 검토 후보처럼 보이는가
- 어떤 기간 window에 걸리는지 다시 설명해 줄 수 있는가

### 추가 검토 필요 사항
- 어떤 부분이 unresolved 상태인가
- Pro 결과를 보고도 사람이 다시 확인해야 할 포인트는 무엇인가
