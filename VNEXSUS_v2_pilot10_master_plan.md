# VNEXSUS_v2 — 10케이스 실파이프라인 파일럿 검증 마스터 계획서
_실행 계획 + 단계별 운영 원칙 + Codex 실행 지시문 통합본_

---

## 0. 문서 목적

이 문서는 `VNEXSUS_v2`의 **10케이스 실파이프라인 파일럿 검증**을 실제로 진행하기 위한 통합 운영 문서다.

이 문서의 목적은 아래 5가지다.

1. 파일럿 검증의 **범위와 기준**을 고정한다.
2. 실제 앱의 **OCR → 후처리 → 구조화 → narrative/PDF** 파이프라인을 기준으로 검증한다.
3. `CaseN_report.txt`를 **의료 정보 부분집합 정답지**로 사용하는 방식과 그 한계를 명확히 정의한다.
4. **재현 가능한 실행 체계**(manifest, snapshot, golden JSON, budget hard-stop, 결과 리포트)를 만든다.
5. Codex가 논의가 아니라 **정해진 기준에 따라 실행만 하도록** 단계별 지시문까지 포함한다.

---

## 1. 파일럿 개요

### 1.1 핵심 요약
- 현재 검증 가능한 기준 데이터는 `CaseN.txt + CaseN_report.txt` **44쌍**
- 원본 문서 폴더는 **51케이스**
- 전체 원본 문서 예상 페이지 수는 약 **3249p**
- 비용 상한은 **OCR + 토큰 합산 $10**
- 따라서 이번 1차 검증 범위는 **10케이스 파일럿**으로 고정한다

### 1.2 검증 기본 철학
- 검증은 반드시 **현재 앱의 실제 OCR→후처리→보고서 파이프라인**을 탄다
- `CaseN_report.txt`는 **의료 외 정보 제외 후 의료 정보 부분집합 정답지**로 사용한다
- 앱의 목표는 “날짜별 의료 이벤트 전체집합”이다
- 최소 기준은 **정답 부분집합 100% 포함**
- 특히 **날짜 누락 0**을 가장 강한 기준으로 둔다

### 1.3 최종 산출물
- HTML 리포트 1종
- JSON 요약 2종
- Golden JSON 세트
- 10케이스 실행 manifest
- validation 환경 snapshot

---

## 2. 현재 이해와 고정 가정

### 2.1 데이터 가정
- `C:\VNEXSUS\VNEXSUS_reports_pdf\sample_pdf\caseN_report` 에 `CaseN.txt`, `CaseN_report.txt` 44쌍 존재
- `C:\VNEXSUS\VNEXSUS_reports_pdf\sample_pdf\sample_pdf` 에 51개 원본 케이스 폴더 존재
- `prepared_coordinate_cases`, `offline_ocr_samples`, `results` 등 일부 기존 산출물에는 좌표 포함 OCR 참조 JSON이 존재할 수 있다

### 2.2 정답 해석 가정
- `CaseN_report.txt`는 사람이 작성한 조사 보고서다
- 보험정보, 청구정보, 수임정보 등 **비의료 정보는 비교 대상에서 제외**
- 의료 사실만 **부분집합 정답지**로 본다

### 2.3 시스템 경계
입력:
- 원본 PDF/TIFF/이미지
- 사용자 입력 케이스 메타데이터

코어 파이프라인:
- OCR blocks
- date candidates
- date-centered windows
- event atoms
- event bundles
- structured output
- narrative
- PDF

### 2.4 절대 원칙
- `insuranceJoinDate`는 OCR 대상이 아니라 **사용자 입력 metadata**
- OCR 전체 텍스트를 한 번에 최종 보고서로 보내는 평가 금지
- evidence 없는 핵심 이벤트 확정 금지
- mock 결과를 real 결과처럼 표현 금지
- 검증 대상 Git SHA와 환경 모드를 반드시 고정

---

## 3. 범위 / 비범위

### 3.1 범위
- 10케이스 파일럿 대상 선정
- 각 케이스별 `원본 문서 ↔ CaseN raw/report ↔ 좌표 참조자료` 매핑
- 실제 앱 API/파이프라인으로 검증
- 단계별 성공/실패 지점 기록
- 의료 정보 부분집합 포함률 평가
- HTML + JSON 리포트 생성
- Starter/Pro 판단에 도움이 되는 실패 유형 분류

### 3.2 비범위
- 44/50케이스 전체 실행
- 배포 작업 자체
- Starter/Pro 과금 로직 구현
- 결제/소셜로그인 구현
- UI 리디자인 실제 구현
- baseline 재정리 실행
- production 운영 자동화 구현

---

## 4. 실행 전 반드시 추가할 보강점

이번 파일럿은 그대로 시작하지 않는다. 아래를 **실행 전 필수 보강**으로 간주한다.

### 4.1 검증 대상 SHA 고정
리포트 맨 위에 아래를 고정한다.
- `git SHA`
- `branch`
- `run date`
- `OCR mode/provider`
- `budget cap`

### 4.2 프리플라이트 산출물 추가
실행 전 반드시 생성한다.
- `validation_env_snapshot.json`
- `pilot10_manifest.json`
- `pilot10_budget_plan.json`

### 4.3 골든 JSON 병행
`CaseN_report.txt`만으로는 자동 비교가 약하므로, 아래를 병행한다.
- `CaseN_golden.json`

### 4.4 예산 강제
비용 규칙은 사람이 기억하는 방식이 아니라 **runner가 강제**한다.
- 하드 스톱: 누적 $10 초과 금지
- soft alert: 80% 도달 시 경고
- stop trigger: 80% 이상이면 중간 보고 후 중단 가능

### 4.5 실패 taxonomy 3층 분류
실패 유형은 아래 3층으로 고정한다.
- Intake
- OCR
- Semantic

---

## 5. 파일럿 선정 규칙

### 5.1 모집단
- 기본 모집단은 `44쌍 유효 케이스`만 사용
- 원본 문서와 `CaseN_report` 매핑 가능한 케이스만 후보

### 5.2 분포 규칙
페이지 분포를 강제로 섞는다.
- 저페이지(<=30p) 3건
- 중간(31~80p) 4건
- 고페이지(81p+) 3건

### 5.3 난이도 분포
아래 유형을 반드시 섞는다.
- 날짜가 많은 케이스
- 병원 이동이 많은 케이스
- 입원/수술 포함 케이스
- 날짜 후보가 적은 케이스
- 실패 가능성이 있는 케이스 1건 이상

### 5.4 우선순위
- 좌표 참조 JSON이 이미 있는 케이스 우선
- 원본 문서 ↔ report 매핑이 확실한 케이스 우선
- 페이지 적은 케이스부터 예산 검증 시작

### 5.5 선정표 필수 필드
`pilot10_manifest.json`과 HTML 리포트의 선정표에 아래 필드를 포함한다.
- `caseName`
- `sourceCaseIndex`
- `mappingConfidence` (`high|medium|low`)
- `manualConfirmed` (`true|false`)
- `hasCoordinateReference` (`true|false`)
- `estimatedPages`
- `estimatedCost`
- `difficultyTags`

---

## 6. 프리플라이트 단계 (Phase 0)

### 6.1 목적
실행 전에 **데이터 문제 / 코드 문제 / 환경 문제**를 구분할 수 있게 만든다.

### 6.2 생성 산출물
#### `validation_env_snapshot.json`
최소 필드:
- `gitSha`
- `branch`
- `runDate`
- `appMode`
- `ocrProvider`
- `gcsEnabled`
- `dbMode`
- `budgetCapUsd`
- `notes`

#### `pilot10_manifest.json`
최소 필드:
- `caseName`
- `sourceCaseName`
- `sourceDocs`
- `rawTxtPath`
- `reportTxtPath`
- `coordinateReferencePath`
- `mappingConfidence`
- `manualConfirmed`
- `estimatedPages`
- `estimatedCost`
- `difficultyTags`

#### `pilot10_budget_plan.json`
최소 필드:
- `totalBudgetCap`
- `softStopThreshold`
- `hardStopThreshold`
- `perCaseEstimatedCost`
- `orderedExecutionPlan`
- `stopRule`

### 6.3 프리플라이트 체크리스트
- 검증 대상 SHA 고정
- env 모드 확인
- OCR provider 모드 확인
- DB 연결 가능 여부 확인
- GCS/Vision credential 확인
- 44쌍 ↔ 51원본 매핑 초안 생성
- 페이지 수 추정
- 비용 예산표 생성
- 10케이스 최종 선정표 확정

---

## 7. 골든셋 준비 단계 (Phase 1)

### 7.1 목적
정답지를 사람이 읽는 텍스트와 기계 비교용 JSON으로 동시에 고정한다.

### 7.2 입력
- `CaseN_report.txt`
- 필요 시 `CaseN.txt`
- 원본 문서
- 좌표 참조 자료(있으면 참고)

### 7.3 출력
케이스당 아래 파일 1개 생성:
- `CaseN_golden.json`

### 7.4 골든 JSON 최소 구조
```json
{
  "caseName": "Case12",
  "medicalEvents": [
    {
      "date": "2020-01-05",
      "hospital": "OO병원",
      "eventType": "검사",
      "medicalFact": "MRI 검사 시행",
      "nonMedical": false,
      "requiredEvidencePages": [3, 4],
      "mustInclude": true
    }
  ]
}
```

### 7.5 필수 필드
- `date`
- `hospital`
- `eventType`
- `medicalFact`
- `nonMedical`
- `requiredEvidencePages`

선택 필드:
- `mustInclude`
- `mustNotInclude`
- `notes`

### 7.6 태깅 원칙
- 파일럿 10건은 수동 태깅을 기준으로 한다
- 의료 정보만 태깅한다
- `nonMedical=true`는 비교 대상에서 제외한다
- 날짜가 명시된 핵심 의료 사실은 반드시 태깅한다
- 날짜 누락 0이 최우선 기준이다

---

## 8. 실제 파이프라인 실행 단계 (Phase 2)

### 8.1 목적
실제 앱 API/파이프라인으로 10케이스를 순차 실행한다.

### 8.2 실행 원칙
- 실제 앱 API 호출만 사용
- 앱 코어 로직은 수정하지 않는다
- 별도 validation runner가 앱 API를 호출한다
- 예산 hard-stop을 runner가 강제한다

### 8.3 케이스별 실행 흐름
#### Step 1. 케이스 생성
- 실제 앱에서 case 생성
- 필수 metadata 입력
- 환자명
- 보험가입일
- 보험가입일은 비교 대상에서 분리

#### Step 2. 문서 업로드
- 원본 PDF/TIFF/이미지 업로드
- 업로드 성공 여부 기록
- 문서 수 / 타입 / 페이지 수 기록

#### Step 3. OCR 실행
- 현재 앱의 실제 OCR 라우트 사용
- OCR blocks 저장 여부 확인

실패 시 분류:
- OCR provider 실패
- 문서 형식 실패
- GCS/credential 실패
- OCR blocks 저장 실패

#### Step 4. 후처리 검증
아래 단계별 존재/성공 여부 기록
- date candidates
- date-centered windows
- event atoms
- event bundles
- structured output
- narrative
- PDF

실패 시 정확히 단계명으로 기록한다.

#### Step 5. 정답 비교
비교 단위는 문장 유사도가 아니라 의료 사실 단위다.

케이스별 측정 지표:
- 정답 의료 날짜 포함률
- 정답 이벤트 포함률
- 날짜 오귀속 건수
- 병원 오귀속 건수
- evidence 없는 이벤트 수
- 앱만 잡고 사람 보고서엔 없는 추가 의료 이벤트 수

중요:
- `CaseN_report.txt`는 부분집합이므로 앱 결과가 더 많아도 가능
- 하지만 정답 의료 내용 누락은 치명 오류로 본다

---

## 9. 실패 taxonomy (고정)

### 9.1 Intake 실패
- case 생성 실패
- 문서 업로드 실패
- 파일 형식 파싱 실패
- 원본 문서 ↔ report 매핑 실패

### 9.2 OCR 실패
- provider 호출 실패
- credential/GCS 실패
- OCR raw output 없음
- OCR blocks 저장 실패

### 9.3 Semantic 실패
- dateCandidates 없음
- date-centered windows 생성 실패
- hospital 귀속 실패
- event atom 생성 실패
- event bundle 생성 실패
- narrative 생성 실패
- PDF 렌더 실패

---

## 10. 비용 관리 규칙

### 10.1 하드 규칙
- 누적 비용 $10 초과 금지

### 10.2 소프트 규칙
- 예산의 80% 도달 시 경고
- 80% 도달 후에는 자동 중단 또는 운영 판단 중단

### 10.3 실행 순서
- 페이지 수 적은 케이스부터 실행
- 고페이지 케이스는 후순위
- 예산 대비 분포를 보며 10건 완료 가능성 판단

### 10.4 runner가 강제할 필드
- `estimatedPages`
- `estimatedOcrCost`
- `estimatedLlmCost`
- `actualOcrCost`
- `actualLlmCost`
- `budgetStopTriggered`

---

## 11. 수동 검증 의무 규칙

### 11.1 최소 수동 검증
- 최소 2케이스는 OCR blocks와 좌표 evidence를 눈으로 직접 대조
- 최소 2케이스는 날짜가 많은 문서로 선택
- 최소 1케이스는 실패 케이스를 포함해 원인 절단 검증

### 11.2 수동 검증 포인트
- 날짜 추출이 실제 evidence와 맞는가
- 병원 귀속이 맞는가
- 핵심 이벤트가 빠지지 않았는가
- 추가 이벤트가 evidence를 가지는가

---

## 12. 리포트 산출물 (Phase 3)

### 12.1 저장 위치
기본값:

`C:\VNEXSUS\VNEXSUS_reports_pdf\validation_reports\<timestamp>_pilot10_validation.html`

같은 폴더에 함께 저장:
- `pilot10_summary.json`
- `pilot10_case_results.json`

### 12.2 JSON 최소 구조
#### `pilot10_summary.json`
최소 필드:
- `gitSha`
- `runDate`
- `budgetCapUsd`
- `actualSpendUsd`
- `selectedCases`
- `successCount`
- `failureCount`
- `stageSuccessRates`
- `qualityMetrics`
- `recommendations`

#### `pilot10_case_results.json`
케이스당 최소 필드:
- `caseId`
- `sourceCaseName`
- `sourceDocs`
- `pipelineStageStatus`
- `dateCoverage`
- `eventCoverage`
- `misattributions`
- `evidenceIssues`
- `extraAppEvents`
- `costEstimate`
- `failureTaxonomy`
- `manualReviewNotes`

### 12.3 HTML 리포트 구성
#### 1. 개요
- 파일럿 범위
- 총 케이스 수
- 총 페이지 수
- 실제 비용 추정
- 성공/실패 케이스 수
- 검증 대상 SHA / branch / run date / provider

#### 2. 파이프라인 단계별 성공률
- 업로드 성공률
- OCR 성공률
- blocks 저장 성공률
- date candidate 성공률
- event bundle 성공률
- narrative/PDF 성공률

#### 3. 날짜/이벤트 품질 지표
- 날짜 포함률
- 의료 이벤트 포함률
- 날짜 오귀속 건수
- 병원 오귀속 건수
- evidence 누락률

#### 4. 케이스별 상세 표
- 케이스명
- 문서 수 / 페이지 수
- 단계별 통과 여부
- 정답 부분집합 포함률
- 주요 실패 유형
- 추가 의료 이벤트 수
- 샘플 evidence 링크 또는 요약

#### 5. 실패 유형 분류
- Intake 실패형
- OCR 실패형
- Semantic 실패형

#### 6. 개발 제안
- 우선 수정 모듈
- Starter에서 충분한 범위
- Pro가 필요한 실패 유형
- 44/50케이스 확장 조건

---

## 13. Starter / Pro 판단 지표

### 13.1 Starter가 커버하는 영역
- OCR 기반 의료 이벤트 정리
- 날짜/병원/기본 사건 단위 구조화
- evidence 연결이 명확한 케이스
- 단순 narrative/PDF 생성

### 13.2 Pro가 필요한 실패 유형
- 날짜 후보 부족
- 다문서 병원 귀속 불안정
- 서술형 종합 판단 필요
- 앱이 잡은 추가 이벤트 해석 필요
- 약관/판례/판단 의견 결합 필요

### 13.3 별도 자산으로 남겨야 할 칼럼
- `extraAppEvents`
- 정답 보고서에는 없지만 앱이 잡은 의료 이벤트
- evidence 있음/없음
- 유효 여부 판정

이건 장기적으로 Pro 가치 제안에 연결될 수 있다.

---

## 14. 단계별 실행 체계

### Phase 0 — 프리플라이트
목표:

환경/데이터/예산/매핑 기준 고정

산출물:
- `validation_env_snapshot.json`
- `pilot10_manifest.json`
- `pilot10_budget_plan.json`

### Phase 1 — 골든셋 준비
목표:

`CaseN_golden.json` 생성

산출물:
- 케이스별 Golden JSON
- 의료/비의료 분리 태깅

### Phase 2 — 실파이프라인 실행
목표:

실제 API 호출로 10케이스 실행

산출물:
- 케이스별 단계별 상태 기록
- 예산 누적 기록
- 실패 taxonomy 기록

### Phase 3 — 비교/리포트
목표:

HTML + JSON 리포트 생성

산출물:
- HTML 리포트
- summary JSON
- case results JSON

### Phase 4 — 후속 개발 제안
목표:

확장/상품화/수정 우선순위 도출

산출물:
- Starter/Pro 판단 근거
- 44/50케이스 확장 조건
- 우선 수정 모듈 정리

---

## 15. 세션 공통 마스터 프롬프트

아래 프롬프트는 새 세션에서 공통으로 사용한다.

이 세션은 VNEXSUS_v2의 10케이스 실파이프라인 파일럿 검증을 진행하기 위한 연장선이다.

내 역할은 비개발자 PM/지휘자다.  
나는 코드를 직접 검토하거나 기술적 정합성을 판별하지 않는다.  
기술 판단은 항상 네가 한다.

너의 역할:
- CTO
- 기술 감리자
- 검수자
- 파일럿 검증 운영자

항상 아래 원칙을 따른다.

1. 실제 앱 파이프라인(OCR → 후처리 → 보고서)을 기준으로 검증한다.
2. mock 결과를 real 결과처럼 표현하지 않는다.
3. `CaseN_report.txt`는 의료 정보 부분집합 정답지로 사용한다.
4. `CaseN_golden.json`을 병행 생성해 기계 비교 기준을 만든다.
5. 검증 대상 SHA / branch / provider / budget cap을 반드시 고정한다.
6. 예산 hard-stop은 runner가 강제한다.
7. 실패 유형은 Intake / OCR / Semantic 3층 taxonomy로 고정한다.
8. 최소 2케이스는 수동 evidence 검증을 수행한다.
9. HTML + JSON 리포트를 동시에 남긴다.
10. 기술 판단을 나에게 넘기지 않는다.

답변 형식:
1. 판정
- 계속 진행
- 보완 후 진행
- 중지 후 재설계

2. 이유
- 짧고 명확하게
- 비개발자도 이해 가능하게

3. 위험도
- 낮음
- 중간
- 높음

4. 다음 지시문
- Codex에 바로 붙여넣을 수 있게 코드블록으로 제공

---

## 16. Codex 실행 지시문 — Phase 0 프리플라이트

지금부터는 “Phase 0 프리플라이트”만 수행하라.  
새 기능 추가, 앱 코어 수정, UI 작업 금지다.

### 목표
1. 검증 대상 Git SHA와 실행 환경을 고정
2. 44쌍/51원본 매핑 초안을 생성
3. 페이지 수/예상 비용 계산
4. 10케이스 파일럿 선정표와 manifest를 만든다

### 절대 금지
- 실파이프라인 실행 시작
- OCR 호출
- narrative/PDF 생성
- env 추정 변경
- baseline 작업 착수

### 생성해야 할 산출물
- `validation_env_snapshot.json`
- `pilot10_manifest.json`
- `pilot10_budget_plan.json`

### `validation_env_snapshot.json` 최소 필드
- `gitSha`
- `branch`
- `runDate`
- `appMode`
- `ocrProvider`
- `dbMode`
- `gcsEnabled`
- `budgetCapUsd`

### `pilot10_manifest.json` 최소 필드
- `caseName`
- `sourceCaseName`
- `rawTxtPath`
- `reportTxtPath`
- `sourceDocs`
- `coordinateReferencePath`
- `mappingConfidence`
- `manualConfirmed`
- `hasCoordinateReference`
- `estimatedPages`
- `estimatedCost`
- `difficultyTags`

### `pilot10_budget_plan.json` 최소 필드
- `totalBudgetCap`
- `softStopThreshold`
- `hardStopThreshold`
- `perCaseEstimatedCost`
- `orderedExecutionPlan`
- `stopRule`

### 제출 형식
#### A. 한 줄 결론
- 프리플라이트 완료 여부
- 10케이스 선정 가능 여부

#### B. 생성 파일 목록
- 실제 생성 경로

#### C. 선정표 요약
- 저/중/고페이지 분포
- 난이도 태그 분포
- 좌표 참조 자료 보유 여부

#### D. 주요 리스크
- 최대 5개

#### E. 실행 증빙
- `git rev-parse HEAD`
- `git status --short --branch`
- 생성된 JSON 파일 핵심 요약

---

## 17. Codex 실행 지시문 — Phase 1 골든셋 준비

지금부터는 “Phase 1 골든셋 준비”만 수행하라.  
앱 코어 수정, UI 작업, OCR 실행 금지다.

### 목표
1. `pilot10` 대상 케이스별 `CaseN_golden.json` 생성
2. 의료/비의료 정보를 구분
3. 기계 비교 가능한 필드를 고정

### 입력
- `pilot10_manifest.json`
- `CaseN_report.txt`
- `CaseN.txt`
- 필요한 경우 원본 문서 참고

### 출력
- `CaseN_golden.json` (케이스당 1개)

### 각 JSON 최소 필드
- `date`
- `hospital`
- `eventType`
- `medicalFact`
- `nonMedical`
- `requiredEvidencePages`

### 원칙
- 의료 정보만 비교 대상으로 사용
- `nonMedical=true`는 비교에서 제외
- 날짜 누락 0 기준
- 사람이 이해 가능한 요약이 아니라 기계 비교 가능 구조를 우선

### 제출 형식
#### A. 한 줄 결론
- 골든셋 생성 완료 여부

#### B. 생성 파일 목록
- 케이스별 JSON 경로

#### C. 태깅 통계
- 총 이벤트 수
- 의료 이벤트 수
- 비의료 제외 수

#### D. 리스크
- `requiredEvidencePages`가 불명확한 케이스
- 병원/날짜 추정이 필요한 케이스

---

## 18. Codex 실행 지시문 — Phase 2 실파이프라인 실행

지금부터는 “Phase 2 실파이프라인 실행”만 수행하라.  
앱 코어 수정 금지, UI 개편 금지, baseline 작업 금지다.

### 목표
1. 10케이스를 실제 앱 API로 실행
2. 단계별 성공/실패를 기록
3. budget hard-stop을 강제
4. 실패 taxonomy를 Intake/OCR/Semantic으로 기록

### 절대 금지
- 앱 내부 우회 실행
- mock 결과를 real처럼 표기
- budget hard-stop 무시
- 보고서만 보고 성공 판정

### 케이스별 실행 단계
1. case 생성
2. metadata 입력
3. 문서 업로드
4. OCR 실행
5. OCR blocks 확인
6. date candidates 확인
7. windows 확인
8. event atoms 확인
9. event bundles 확인
10. structured output
11. narrative
12. PDF

### 기록 필드
- `caseId`
- `sourceCaseName`
- `pipelineStageStatus`
- `failureTaxonomy`
- `actualOcrCost`
- `actualLlmCost`
- `budgetStopTriggered`

### 제출 형식
#### A. 한 줄 결론
- 실행 완료 케이스 수
- 중단 여부
- budget 상태

#### B. 케이스별 상태표
- `caseName`
- `pages`
- `stages passed`
- `failure taxonomy`
- `cost`
- `notes`

#### C. budget 보고
- 누적 비용
- 80% 도달 여부
- hard-stop 발생 여부

#### D. 실패 요약
- Intake / OCR / Semantic 건수

---

## 19. Codex 실행 지시문 — Phase 3 비교 및 리포트

지금부터는 “Phase 3 비교 및 리포트 생성”만 수행하라.  
앱 코어 수정 금지, UI 작업 금지다.

### 목표
1. 앱 결과와 `CaseN_golden.json` 비교
2. HTML + JSON 리포트 생성
3. Starter/Pro 판단에 필요한 실패 유형 정리

### 생성 산출물
- `pilot10_summary.json`
- `pilot10_case_results.json`
- `<timestamp>_pilot10_validation.html`

### 비교 지표
- 정답 의료 날짜 포함률
- 정답 이벤트 포함률
- 날짜 오귀속 건수
- 병원 오귀속 건수
- evidence 없는 이벤트 수
- 앱만 잡은 추가 의료 이벤트 수

### 제출 형식
#### A. 한 줄 결론
- 파일럿 성공 여부
- 44/50 확장 가능 여부 초안

#### B. 생성 파일 목록
- 실제 저장 경로

#### C. 요약 지표
- 날짜 포함률
- 이벤트 포함률
- 주요 실패 유형
- 추가 이벤트 발견 수

#### D. 개발 제안
- Starter 충분 영역
- Pro 필요 영역
- 우선 수정 모듈

---

## 20. Codex 실행 지시문 — Phase 4 후속 개발 준비

지금부터는 “Phase 4 후속 개발 준비”만 수행하라.  
새 기능 구현 금지, 배포 작업 금지다.

### 목표
1. Starter/Pro 판단 근거를 정리
2. 44/50케이스 확장 조건 제시
3. 우선 수정 모듈과 유지보수 항목 정리

### 제출 형식
#### A. 한 줄 결론
- Starter 현재 커버 범위
- Pro가 필요한 실패 유형

#### B. 확장 조건
- 44케이스 확장 조건
- 50케이스 확장 조건

#### C. 우선 수정 모듈
- 1순위
- 2순위
- 3순위

#### D. 보류 항목
- UI 리디자인
- 간편 로그인
- 한국형 결제
- 동의문서 실내용

---

## 21. 최종 운영 원칙 요약

한 줄로 정리하면 아래와 같다.

10케이스 파일럿은 실제 앱 파이프라인을 기준으로, SHA/환경/예산/골든셋을 고정한 상태에서 실행하고, HTML + JSON 결과를 남기는 첫 실전 회귀 하네스다.

---

## 22. 지금 바로 실행할 체크리스트

1. `validation_env_snapshot.json` 생성
2. `pilot10_manifest.json` 생성
3. `pilot10_budget_plan.json` 생성
4. 10케이스 선정표 확정
5. `CaseN_golden.json` 생성
6. budget hard-stop 로직 runner에 반영
7. Intake/OCR/Semantic taxonomy 고정
8. 최소 2케이스 evidence 수동 검증 계획 추가
9. HTML + summary JSON + case results JSON 저장 경로 고정
10. Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 순서로만 진행
