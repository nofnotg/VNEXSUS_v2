# Acceptance / QA / Golden Set 기준

## 1. 테스트 레벨
- unit test
- integration test
- golden set regression
- manual reviewer QA

## 2. 필수 테스트 영역
### 날짜 파싱
- 다양한 날짜 형식
- OCR 오인식 보정
- 미래/비정상 날짜 제외

### 날짜 유형 판정
- visit / exam / result / pathology / surgery / admission / discharge / history 분리

### 이벤트 번들링
- 같은 날짜 다른 사건 분리
- 다른 날짜 하나의 사건으로 잘못 합치지 않기
- 병원 전환 구분

### evidence 연결
- page jump
- quote 매칭
- bbox highlight
- missing evidence fallback

### 보고서 슬롯
- 10항목 누락 여부
- 진단/검사/치료/과거력 섞임 여부
- ICD/KCD 병기 형식

### 권한/플랜
- 일반사용자/조사자 접근 제한
- 정밀확인 플랜 gating
- 사용량 차감 검증

## 3. Golden Set 구성 원칙
최소 10건부터 시작한다.

케이스 구성:
1. 쉬운 외래
2. 검사/결과일 분리
3. 입원/퇴원
4. 수술/병리
5. 과거력 혼재
6. 다병원
7. OCR 난독
8. 가입일 경계 근접
9. 추적관찰 반복
10. 긴 문서

## 4. Golden Set 저장 형식 예시
```json
{
  "caseId": "case_001",
  "insuranceJoinDate": "2022-01-01",
  "expected": {
    "majorDates": ["2021-12-20", "2022-01-10"],
    "majorHospitals": ["OO병원"],
    "mustInclude": ["조직검사", "간혈관종"],
    "mustNotInclude": ["문서발급일을 내원일로 판단"],
    "requiredEvidencePages": [3, 4]
  }
}
```

## 5. 조사자 수락 기준
- 보고서만으로 핵심 흐름 파악 가능
- 최소 1회 클릭으로 근거 확인 가능
- 원문 재검토 부담 감소

## 6. 일반사용자 수락 기준
- 무엇을 확인해야 하는지 이해 가능
- 과도한 확정적 표현 없음
- 추가분석/전문가연결 흐름 자연스러움

## 7. 실패 정의
- 문서 발급일을 사건 날짜로 확정
- 결과 설명일을 검사 시행일로 오인
- 과거력을 현재 사건에 합침
- evidence 없는 핵심 이벤트 노출
- 가입일 누락/오반영
- 정밀확인 없이 상위 결과처럼 보이게 표시

## 8. 수동 QA 체크리스트
- 날짜가 시간순으로 맞는가
- 병원명이 맞는가
- 진단/검사/치료가 구분되는가
- 10항목이 억지로 채워지지 않았는가
- quote/context가 납득 가능한가
- 일반사용자 문구가 과장되지 않았는가
