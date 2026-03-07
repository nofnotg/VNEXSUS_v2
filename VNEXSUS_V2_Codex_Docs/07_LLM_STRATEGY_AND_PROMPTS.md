# LLM 사용 전략 및 프롬프트 설계

## 1. 목적
이 문서는 LLM을 어디에, 어떤 형태로, 어떤 비용 구조로 사용할지 정의한다.
핵심은 많이 쓰는 것이 아니라 정확하게 필요한 곳에만 쓰는 것이다.

## 2. 대원칙
1. 전량 OCR, 선택적 정밀분석
2. 전체 문서를 한 번에 최종 보고서로 보내지 않는다.
3. 중간 단계는 모두 구조화 JSON으로 받는다.
4. evidence 없는 사실 확정 금지
5. 미리확인/Starter는 OCR만 기본 경로
6. 정밀확인/Pro 이상에서만 선택적 추가분석

## 3. 플랜별 처리 전략
### 일반사용자 미리확인
- OCR 전량
- 규칙/휴리스틱 분석
- 추가분석 자동 실행 없음
- 사용자가 선택 시 업셀

### 일반사용자 정밀확인
- OCR 전량
- ambiguity 높은 페이지/블록만 Spot Resolver
- 필요 시 Case Helper

### 조사자 Starter
- OCR 전량
- 최소 정리
- 정밀분석 옵션은 수동

### 조사자 Pro / Studio
- OCR 전량
- ambiguity 기반 자동 추천
- 고위험 이벤트 자동 보강
- Case Helper 사용 가능

## 4. LLM 역할 정의
### Spot Resolver
- 날짜 유형 판정
- 이벤트 귀속 판정
- ICD/KCD 병기 보강
- OCR 애매 블록 보정

### Case Helper
- EventBundle 충돌 점검
- 누락 슬롯 보강
- 사람이 검토해야 할 포인트 제안
- 보고서 문장 매끄럽게 정리

## 5. Vision OCR / Vision LLM 전략
### 기본 구조
- 모든 페이지: Vision OCR
- 일부 애매 페이지/블록: 정밀모델

### Vision LLM 호출 조건
- 한 문단에 날짜 2개 이상
- 결과 확인/추적관찰/타병원/과거력 표현 혼재
- 병리/수술/입퇴원 이벤트
- OCR confidence 낮음
- 의미 판정이 모호함

### Vision LLM 비호출 조건
- 명확한 외래 내원/단순 처방
- boilerplate/행정문서
- 규칙과 evidence로 충분히 확정 가능한 경우

## 6. Prompt 원칙
1. 보고서 전체 작성 프롬프트 금지
2. 질문은 하나의 판정 과제로 좁힌다.
3. 입력은 작은 문맥 윈도우만 준다.
4. 출력은 JSON으로 제한한다.
5. reason 필드는 짧고 명확하게 받는다.
6. 반대 해석 가능성이 있으면 ambiguity를 드러낸다.

## 7. Spot Resolver 프롬프트 템플릿
```md
당신의 역할은 의료문서 날짜 판정기입니다.

목표:
주어진 문맥에서 중심 날짜의 유형을 판정하고,
이 날짜가 실제 의료이벤트의 중심인지 판단하십시오.

출력은 반드시 JSON만 반환하십시오.

판정 가능한 date_type:
visit, exam, result, pathology, surgery, admission, discharge, plan, history, admin, irrelevant

입력:
- insuranceJoinDate: {{insuranceJoinDate}}
- sourceFileId: {{sourceFileId}}
- fileOrder: {{fileOrder}}
- pageOrder: {{pageOrder}}
- centerBlockText: {{centerBlockText}}
- surroundingContext: {{surroundingContext}}
- extractedHints:
  - hospitalCandidates: {{hospitalCandidates}}
  - diagnosisCandidates: {{diagnosisCandidates}}
  - examCandidates: {{examCandidates}}

반환 형식:
{
  "date_type": "...",
  "is_material": true,
  "reason": "...",
  "confidence": 0.0
}
```

## 8. Case Helper 프롬프트 템플릿
```md
당신의 역할은 의료이벤트 정합성 검토기입니다.

목표:
1) EventBundle 간 충돌을 찾고
2) slot JSON의 누락/모순을 보강하며
3) evidence가 약한 부분을 review flag로 반환하십시오.

중요:
- evidence 없이 사실을 새로 만들어내지 마십시오.
- 확정할 수 없으면 unresolved로 남기십시오.
- 출력은 반드시 JSON만 반환하십시오.

입력:
- patientInfo: {{patientInfo}}
- eventBundles: {{eventBundles}}
- slotJson: {{slotJson}}
- unresolvedFlags: {{unresolvedFlags}}

반환 형식:
{
  "updatedSlotJson": {},
  "reviewFlags": [],
  "unresolved": [],
  "confidenceSummary": { "overall": 0.0 }
}
```

## 9. 비용 제어 규칙
- 전 페이지 LLM 금지
- `ambiguity_score`가 임계값 이상일 때만 후보 생성
- Premium 이상에서만 자동 실행
- Batch 가능 작업은 batch 경로 사용
- 긴 문서는 block/window 단위로 자른다

## 10. 실패 처리
- LLM 실패 시 deterministic 결과 유지
- JSON parse 실패 시 해당 판정만 fallback
- 전체 파이프라인 실패로 확대 금지
- `reviewRequired = true` 표기

## 11. 결과 품질 기준
- LLM 호출 전후 ambiguity 감소
- date type accuracy 향상
- slot fill completeness 향상
- hallucination 없음
- evidence 추적성 유지
