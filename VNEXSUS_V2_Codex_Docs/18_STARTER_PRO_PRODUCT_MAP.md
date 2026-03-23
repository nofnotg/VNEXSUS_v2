# Starter / Pro 제품 맵

## 목적

이 문서는 Starter 와 Pro 의 실제 제품 경계를 문서 수준에서 고정한다.

## Starter

### 누가 쓰는가

- 설계사가 현장에서 빠르게 1차 검토할 때

### 무엇을 제공하는가

- 전체 사건 개요
- 날짜 순 의료 이벤트 시계열
- 병원 / 진단 / 검사 / 입원 / 수술 / 병리의 개괄 정리
- 보험가입일 기준 고지의무 검토 개요
- 정확도 / 편차 / 검토 필요 안내
- 의료적 / 보험적 판단 금지 고지
- 기본 공유용 리포트

### 무엇을 하지 않는가

- 고비용 전면 vision 처리
- 심층 질문/검색
- 전문가 수준의 상세 drill-down
- 최종 판단 확정

## Pro

### 누가 쓰는가

- 더 깊은 검토가 필요한 설계사
- 복잡한 사건을 재검토해야 하는 사용자

### 무엇을 제공하는가

- Starter 전체 포함
- selective vision cross-check
- 더 자세한 질환군별 정리
- 질문 / 검색 / 재질문
- 더 강한 evidence drill-down
- 고지의무 후보 진료 상세 검토
- 심층 리포트

### 무엇을 하지 않는가

- 보험금 지급 / 부지급 최종 확정
- 의료적 확정 진단
- 무제한 broad productization 기능

## 현재 구현과의 연결

- 현재 구현은 Starter / Pro 모두의 기반이 되는 코어 엔진 쪽이 더 앞서 있다.
- slice1 / slice2 같은 최근 작업은 weak evidence 를 숨기지 않는 investigator-style 출력 품질 강화인데, 이것은 앞으로 Starter / Pro 출력에 흡수된다.

## 반드시 유지할 제품 안전장치

- `Case3` watch-only
- `Case10` stable improved 보호
- `Case36` cleared-blocker 보호
- insuranceJoinDate 는 OCR 추출 금지
- evidence 없는 핵심 이벤트 확정 금지
