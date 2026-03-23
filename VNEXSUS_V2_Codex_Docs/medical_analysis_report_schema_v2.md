# 의료 분석 공통 출력 스키마 v2

## 목적

이 문서는 설계사 대상 VNEXSUS V2 앱이 공통으로 사용하는 분석 출력의 backbone을 정의한다.

이 스키마는 다음 원칙을 따른다.

- 앱의 핵심은 보고서 문장 생성보다 분석 구조다.
- Starter, Pro, 최종 요약본은 모두 이 공통 분석 결과에서 파생된다.
- 핵심 이벤트는 evidence 없이 확정하지 않는다.
- 앱은 의료적 최종 진단이나 보험적 최종 판단을 대신하지 않는다.

## 적용 범위

- 공통 분석 결과
- Starter 결과
- Pro 심층 분석 결과
- 최종 요약 / export 출력
- 고지의무 검토 섹션

## 최상위 구조

```ts
type MedicalAnalysisReportV2 = {
  caseBasicInfo: CaseBasicInfo
  documentInventorySummary: DocumentInventorySummary
  medicalEventTimeline: MedicalEventItem[]
  diseaseClusters: DiseaseClusterSummary[]
  confidenceAndReview: ConfidenceAndReviewSummary
  disclosureReview: DisclosureReviewSection
  exportableSummary: ExportableSummarySection
  policyNotes: PolicyNote[]
}
```

## 1. caseBasicInfo

```ts
type CaseBasicInfo = {
  caseId: string
  insuredPersonLabel?: string
  plannerMemoLabel?: string
  insuranceJoinDate?: string
  insuranceJoinDateSource: "user_input" | "missing"
  analysisGeneratedAt: string
  activeProductTier: "starter" | "pro"
}
```

규칙:

- `insuranceJoinDate`는 항상 사용자 입력 case metadata 이다.
- OCR, PDF, 이미지, 보고서 문장 안의 날짜를 `insuranceJoinDate`로 취급하지 않는다.
- 입력이 없으면 `insuranceJoinDateSource`는 `missing`으로 두고, 고지의무 검토는 제한 상태로 표시한다.

## 2. documentInventorySummary

```ts
type DocumentInventorySummary = {
  totalDocuments: number
  totalPages?: number
  hospitalsMentioned: string[]
  dateRange?: {
    earliestEventDate?: string
    latestEventDate?: string
  }
  documentGroups: {
    hospital?: string
    documentCount: number
    pageCount?: number
    dominantDocumentTypes?: string[]
  }[]
  sourceQualityNotice?: string[]
}
```

포함해야 하는 내용:

- 문서 수
- 병원별 / 기간별 대략적인 분포
- 스캔 품질, 누락 가능성, 반복 업로드 여부 같은 source quality notice

## 3. medicalEventTimeline

```ts
type MedicalEventItem = {
  eventId: string
  canonicalDate?: string
  eventType:
    | "outpatient"
    | "admission"
    | "surgery"
    | "exam"
    | "pathology"
    | "emergency"
    | "follow_up"
  hospital?: string
  department?: string
  title: string
  shortSummary: string
  diagnoses?: string[]
  exams?: string[]
  treatments?: string[]
  duration?: {
    startDate?: string
    endDate?: string
    admissionDays?: number
    isOneDayAdmission?: boolean
  }
  eventQuality: {
    confidence: "high" | "medium" | "low"
    reviewNeeded: boolean
    unresolvedReason?: string[]
  }
  evidence: EvidenceSection
}
```

타임라인 규칙:

- 외래와 입원은 별도 이벤트 family로 유지한다.
- 당일 입원은 필요 시 `isOneDayAdmission=true`로 표기한다.
- 검사와 검사결과는 가능한 한 pair를 맞춰 요약하되, 근거가 부족하면 review-needed를 유지한다.
- 병리 결과는 별도 `pathology` 이벤트로 유지할 수 있다.
- 응급실 내원은 `emergency`로 별도 유지한다.

## 4. event types

### outpatient
- 외래 내원, 통원 진료, 추적 관찰 외래

### admission
- 입원 시작, 입퇴원 기간, 입원 치료

### surgery
- 시술 / 수술 / intervention / procedure

### exam
- 영상검사, 혈액검사, 기능검사, 내시경 등

### pathology
- 병리보고, 조직검사, 암 확진 근거 문서

### emergency
- 응급실 방문, 응급 평가

### follow_up
- 추적관찰, 경과 관찰, 재진 follow-up

## 5. diseaseClusters

```ts
type DiseaseClusterSummary = {
  clusterType:
    | "cancer"
    | "heart"
    | "brain_cerebrovascular"
    | "surgery"
    | "hospitalization"
    | "chronic_or_other_important"
  status: "present" | "not_found" | "review_needed"
  overview: string
  relatedEventIds: string[]
  keyEvidenceRefs: EvidenceRefLite[]
  reviewNotes?: string[]
}
```

클러스터 규칙:

- 암
- 심장
- 뇌 / 뇌혈관
- 수술
- 입원
- 만성질환 / 기타 중요 소견

설명 원칙:

- present / not_found / review_needed 수준으로 표현한다.
- 질병 확정 자체를 시스템이 최종 판단한 것처럼 쓰지 않는다.
- 핵심 병리, 영상, 입원, 수술 이벤트를 묶어 질환군 개요를 만든다.

## 6. confidence / review-needed / unresolved signaling

```ts
type ConfidenceAndReviewSummary = {
  overallConfidence: "high" | "medium" | "low"
  reviewNeededCount: number
  unresolvedCount: number
  majorReviewFlags: {
    code: string
    title: string
    reason: string
    relatedEventIds?: string[]
  }[]
  sourceVarianceNotice?: string[]
}
```

규칙:

- review-needed는 숨기지 않는다.
- unresolved 상태는 narrative로 덮지 않는다.
- source variance, OCR 한계, 누락 가능성은 별도 notice로 표시한다.

## 7. provenance / evidence fields

```ts
type EvidenceSection = {
  representativeEvidence: EvidenceRefLite[]
  additionalEvidenceCount?: number
  sourceFileIds?: string[]
}

type EvidenceRefLite = {
  evidenceId?: string
  sourceFileId: string
  pageOrder: number
  blockIndex?: number
  quote?: string
}
```

규칙:

- 공통 출력의 핵심 이벤트는 최소 1개 이상의 evidence anchor를 가져야 한다.
- 대표 evidence와 추가 evidence 개수를 분리한다.
- quote는 원문 일부를 유지하되, 노출 수준은 화면/플랜에 따라 달라질 수 있다.

## 8. disclosureReview section

```ts
type DisclosureReviewSection = {
  joinDateAvailable: boolean
  joinDate?: string
  windowPolicyLabel?: string
  candidateOverview: {
    candidateCount: number
    reviewNeededCount: number
  }
  candidateEvents: DisclosureCandidateEvent[]
  policyNotice: string[]
}

type DisclosureCandidateEvent = {
  eventId: string
  canonicalDate?: string
  relativeWindow?: "before_join" | "within_3_months" | "within_1_year" | "within_2_years" | "within_5_years" | "outside_window" | "unknown"
  candidateType?: "diagnosis" | "exam" | "admission" | "surgery" | "pathology" | "follow_up" | "other"
  candidateStrength: "strong" | "medium" | "weak"
  reviewNeeded: boolean
  rationaleSummary: string
  evidence: EvidenceSection
}
```

규칙:

- 고지의무 검토는 overview와 deep review를 구분한다.
- Starter는 후보 개요와 주의 신호를 보여준다.
- Pro는 후보 근거와 분류 이유를 더 깊게 보여준다.
- 앱은 “고지의무 위반 확정” 같은 최종 판단을 하지 않는다.

## 9. exportableSummary section

```ts
type ExportableSummarySection = {
  summaryLevel: "compact" | "detailed"
  sections: {
    type:
      | "case_overview"
      | "timeline"
      | "disease_overview"
      | "disclosure_overview"
      | "opinion_summary"
    title: string
    content: string[]
  }[]
  exportWarnings: string[]
}
```

규칙:

- exportable summary는 파생 출력이다.
- 앱의 전체 identity를 대체하지 않는다.
- compact 모드와 detailed 모드를 둘 수 있다.

## 10. policyNotes

```ts
type PolicyNote = {
  type:
    | "not_medical_diagnosis"
    | "not_claim_approval_judgment"
    | "source_quality_warning"
    | "review_needed"
    | "join_date_missing"
  message: string
}
```

필수 포함 원칙:

- 의료적 최종 진단 아님
- 보험금 승인/거절 판단 아님
- source quality가 결과에 영향을 줄 수 있음

## 11. 출력 금지 / 판단 금지 규칙

- 앱이 의료적 확정 진단을 내리는 것처럼 쓰지 않는다.
- 앱이 보험금 지급 / 부지급을 최종 판정하는 것처럼 쓰지 않는다.
- 고지의무 후보를 “확정 위반”으로 단정하지 않는다.
- evidence가 약한 항목은 clean output으로 덮지 않는다.

## 12. 파생 문서 관계

- `starter_report_spec.md`는 이 공통 스키마를 Starter 표시 규칙으로 제한한다.
- `pro_deep_analysis_spec.md`는 이 공통 스키마에 심층 근거 탐색을 추가한다.
- `final_summary_output_rule.md`는 공통 분석 결과에서 compact export를 파생한다.
- `disclosure_review_engine_spec.md`는 공통 스키마의 disclosureReview section을 별도 정책 문서로 상세화한다.
