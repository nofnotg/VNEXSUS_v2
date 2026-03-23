# Task 문서 — 비정형 의료문서 대응 엔진 실행 계획
_실행 우선순위 / 에픽 / 세부 작업 / 완료기준_

## 문서 목적

이 문서는 PRD를 실제 개발 작업으로 분해한 실행 문서다.

핵심은 다음 세 가지다.

1. 지금 당장 해야 할 일과 나중에 해도 되는 일을 구분한다.
2. 구현 단위를 **Epic → Task → Acceptance Criteria**로 나눈다.
3. tail-risk 제거와 제품화 준비 사이의 순서를 고정한다.

---

# 0. 현재 전제

현재 시스템은 기본 runtime 안정성은 높은 편이며,  
문제의 초점은 “돌아가게 만들기”보다  
**출처 링크 / 날짜 귀속 / 패턴 대응 / low-end risk 제거**다.

---

# 1. 우선순위 기준

## P0
지금 바로 해야 하는 작업.  
제품 신뢰도와 directly 연결됨.

## P1
P0 이후 바로 이어져야 하는 작업.  
품질/정확도에 큰 영향이 있음.

## P2
앞 단계가 정리된 뒤 붙이는 상위 기능.  
Pro 고도화, productization 준비 단계.

---

# 2. Epic A — Source Graph / Provenance Layer

## 목표
결과 항목을 반드시 파일/페이지/좌표 근거와 연결할 수 있게 만든다.

## Task A1 — Source Graph 최소 스키마 정의
**내용**
- file
- page
- block
- line
- token
- date candidate
- institution candidate
- event candidate

**산출물**
- `source_graph_schema.md`
- 필요한 타입 정의 초안

**완료기준**
- 각 노드의 필수 필드가 정의돼 있음
- 최소 source linkage 필드가 포함돼 있음

## Task A2 — timeline event에 provenance 필드 부착
**내용**
다음 필드를 붙인다.
- source_file_id
- source_file_name
- page_number
- bbox / span
- anchor_text(optional)

**산출물**
- 이벤트 객체 스키마 수정
- 예시 JSON 2~3개

**완료기준**
- 임의의 타임라인 항목을 보고 원문 파일/페이지를 추적할 수 있음

## Task A3 — 원문 링크 표현 포맷 설계
**내용**
- 파일명 + 페이지 번호
- 클릭 가능한 anchor
- highlight 대상 span/bbox

**산출물**
- `provenance_link_format.md`

**완료기준**
- Starter 결과에 포함할 수 있는 최소 링크 포맷 합의

---

# 3. Epic B — 날짜 귀속 엔진 v1

## 목표
날짜를 단순 인접성으로 붙이지 않고, 문맥/구조/양식 기준으로 귀속한다.

## Task B1 — 날짜 귀속 유형 정의
**유형**
- forward binding
- backward binding
- mixed binding
- range binding
- carry-forward

**산출물**
- `temporal_binding_types.md`

**완료기준**
- 각 유형의 정의와 예시가 문서화됨

## Task B2 — 날짜 주변 신호(feature) 정의
**예시 신호**
- 날짜 라벨 유무
- 줄/블록 위치
- 같은 페이지 날짜 개수
- 섹션 헤더 여부
- 표셀/표행 관계
- 다음 페이지 새 날짜 여부

**산출물**
- `temporal_binding_features.md`

**완료기준**
- 각 신호의 설명과 점수화 가능 여부 정리

## Task B3 — 귀속 판단 점수 로직 v1 설계
**내용**
각 날짜 후보에 대해:
- 앞 내용을 먹는지
- 뒤 내용을 먹는지
- 구간을 여는지
- carry-forward인지
판정하는 점수 로직 설계

**산출물**
- `temporal_binding_scoring_v1.md`

**완료기준**
- 최소 3개 예시 패턴에 대한 판정 흐름 문서화

---

# 4. Epic C — Single-Date Page / Continuation 처리

## 목표
페이지당 날짜 1개형 양식과, 다음 페이지로 같은 날짜가 이어지는 경우를 다룬다.

## Task C1 — single-date page heuristic 정의
**산출물**
- `single_date_page_heuristic.md`

**완료기준**
- positive/negative example 포함

## Task C2 — continuation 판단 로직 정의
**핵심 신호**
- 다음 페이지 새 날짜 없음
- 새 문서/새 헤더 없음
- 같은 family 유지
- 문단/표 흐름 연속

**산출물**
- `continuation_logic_v1.md`

**완료기준**
- carry-forward 시작/유지/종료 기준 문서화

---

# 5. Epic D — 불확실성 게이트 v1

## 목표
“애매한 곳만 Pro로 올리는” 판단기를 만든다.

## Task D1 — 게이트 입력 신호 정의
**4층 신호**
1. OCR 품질 신호
2. 구조/귀속 충돌 신호
3. 근거 부족 신호
4. 자기검증/대안해석 신호

**산출물**
- `ambiguity_gate_signals_v1.md`

**완료기준**
- 각 신호의 의미와 입력 위치 정리

## Task D2 — 게이트 점수 규칙 설계
**출력**
- safe
- watch
- escalate_to_vision

**산출물**
- `ambiguity_gate_scoring_v1.md`

**완료기준**
- threshold 초안 포함
- false positive / false negative trade-off 포함

## Task D3 — 자기검증 질문 세트 정의
**예시**
- 이 날짜는 진료일인가 작성일인가?
- 이 병원명 정규화는 근거가 충분한가?
- 이 페이지는 이전 페이지와 같은 날짜가 이어지는가?
- source evidence가 충분한가?

**산출물**
- `self_check_question_set_v1.md`

**완료기준**
- Starter 결과를 보조적으로 검증할 질문 세트 정리

---

# 6. Epic E — Starter / Pro 라우팅 구조

## 목표
Starter와 Pro의 역할 차이를 실제 기술 구조로 고정한다.

## Task E1 — Starter 출력 범위 확정
**최소**
- 날짜
- 사건 요약
- 병원명
- 파일/페이지 링크
- 애매한 항목 표시

**산출물**
- `starter_output_contract.md`

**완료기준**
- Starter만으로도 검증 가능한 최소 결과 구조 문서화

## Task E2 — Pro escalation 단위 확정
**예시 단위**
- page-level
- block-level
- table-region-level

**산출물**
- `pro_escalation_unit.md`

**완료기준**
- pinpoint escalation 가능한 설계 명확화

## Task E3 — Pro 질문 기능 범위 정의
**산출물**
- `pro_qa_scope.md`

**완료기준**
- 자유 대화가 아니라 설명형 QA 범위 확정

---

# 7. Epic F — Tail-Risk 중심 품질관리

## 목표
평균보다 저점을 먼저 본다.

## Task F1 — low-end risk 기준 문서화
**산출물**
- `low_end_risk_policy.md`

**완료기준**
- 제품화 판단에 쓸 기준 명문화

## Task F2 — validation에 low-end risk 필드 추가
**필수 필드**
- low_end risk state
- tail-risk 여부
- product-safe 여부

**완료기준**
- 평균 품질만이 아니라 tail-risk가 함께 기록됨

---

# 8. Epic G — Selective Vision 준비

## 목표
전면 vision이 아니라, 필요한 경우에만 vision을 쓸 수 있도록 준비한다.

## Task G1 — Vision escalation 조건표 작성
**산출물**
- `vision_escalation_policy_v1.md`

**완료기준**
- 어떤 경우에 Pro 비용이 발생하는지 명확함

## Task G2 — Vision 응답 포맷 정의
**예시**
- chosen interpretation
- alternative interpretation
- confidence reason
- source page confirmation
- contradiction notes

**산출물**
- `vision_review_contract.md`

**완료기준**
- vision이 구조화된 보조판정기로 설계됨

---

# 9. Epic H — 설명형 QA 준비

## 목표
Pro 질문 기능을 근거 기반 설명 도구로 만든다.

## Task H1 — 답변 템플릿 정의
**형식**
- 결론
- 근거 파일/페이지
- 왜 그렇게 판단했는지
- 대안 해석 가능성
- confidence / ambiguity

**산출물**
- `evidence_qa_answer_template.md`

**완료기준**
- 근거 중심 답변 구조 확정

---

# 10. 구현 순서 제안

## Sprint 1
- A1
- A2
- A3
- F1

## Sprint 2
- B1
- B2
- C1
- C2

## Sprint 3
- B3
- D1
- D2
- D3

## Sprint 4
- E1
- E2
- G1

## Sprint 5
- E3
- G2
- H1
- F2

---

# 11. Done 정의

각 Epic은 아래를 만족해야 “완료”로 본다.

1. 문서화만이 아니라 실제 스키마/출력/판정 구조에 반영됨
2. 최소 예시 2~3개로 동작 설명 가능
3. 회귀 위험이 문서화됨
4. tail-risk 관점에서 영향이 설명됨

---

# 12. 한 줄 결론

다음 단계 개발의 핵심은 기능을 더 많이 붙이는 것이 아니다.  
**출처 링크 + 날짜 귀속 + 패턴 대응 + 불확실성 게이트를 먼저 구현해서,  
비정형 의료문서를 “검증 가능한 구조화 결과”로 바꾸는 것**이다.
