# Starter / Pro 구현 공백 매트릭스

## 목적

이 문서는 현재 원격 저장소 기준 구현 상태를 Starter / Pro 제품 문서와 대조해, 무엇이 이미 엔진에 올라와 있고 무엇이 아직 비어 있는지 정리한다.

판정 기준:

- `already supported`
- `partially supported`
- `not yet built`

주의:

- 판정은 현재 원격 브랜치 구현 흔적 기준이다.
- 문서상 방향만 있는 항목은 구현 완료로 보지 않는다.
- planner-facing 제품 정의는 이미 정렬되었지만, 코드에는 여전히 `consumer / investigator` 명칭이 남아 있다.

## 1. common analysis backbone

| 세부 항목 | 상태 | repository-grounded reason |
| --- | --- | --- |
| 파일 업로드 / OCR ingestion 파이프라인 | already supported | `upload-service.ts`, `ocr-ingestion-service.ts`, Prisma migrations `0003`~`0009`가 업로드→OCR→후속 파이프라인을 이미 연결한다. |
| 날짜-이벤트 구조화 엔진 | already supported | `date-extraction.ts`, `entity-extraction.ts`, `date-centered-window.ts`, `event-atom-builder.ts`, `event-bundle-builder.ts`가 코어 엔진을 구성한다. |
| evidence-linked bundle 생성 | already supported | `event-bundle-service.ts`, `06_EVIDENCE_CONTRACT.md`, `evidenceRefs`/`eventBundles` schema와 함께 코어 evidence 기반 구조가 존재한다. |
| weak evidence / review-needed signaling | already supported | slice1/2 결과로 `bundleQualityGate`, `reviewSignalSummary`, `investigator narrative`의 review-required / insufficient 신호가 구현돼 있다. |
| planner-facing 공통 분석 스키마 v2 직접 출력 | not yet built | `medical_analysis_report_schema_v2.md`는 생겼지만, 이를 그대로 반환하는 서비스나 adapter는 아직 없다. 현재 출력은 `consumerSummaryJson` / `investigatorSlotJson` 중심이다. |

## 2. timeline output

| 세부 항목 | 상태 | repository-grounded reason |
| --- | --- | --- |
| 날짜순 timeline 데이터 생성 | already supported | `consumer-summary-builder.ts`가 날짜순 timeline summary를 만들고, `case-detail-service.ts`도 event list를 구성한다. |
| 이벤트별 review flag 유지 | already supported | `consumerTimelineItem.reviewFlag`, `investigator bundle requiresReview`, `bundleQualityState`가 이미 출력된다. |
| planner-facing Starter timeline block | partially supported | 현재는 `consumer` / `investigator` 출력으로 timeline이 존재하지만, Starter 스펙의 사건개요형 timeline block은 아직 별도 조립되지 않았다. |
| 외래 / 입원 / 수술 / 검사 / 병리 분리 표시 | partially supported | bundle/event type은 있으나 Starter 스키마 수준의 고정 표시 규칙은 아직 화면/출력 계층에 구현되지 않았다. |
| 당일 입원 / 입원일수 표시 | not yet built | 새 공통 스키마의 `admissionDays`, `isOneDayAdmission`에 해당하는 계산/출력 경로가 현재 코드에 없다. |

## 3. disease cluster output

| 세부 항목 | 상태 | repository-grounded reason |
| --- | --- | --- |
| 진단 / 검사 / 수술 / 입원 원재료 확보 | partially supported | `candidateSnapshotJson`, representative diagnosis/test/treatment/surgery fields가 존재해 cluster 재료는 있다. |
| 암 / 심장 / 뇌혈관 / 수술 / 입원 / 만성질환군 cluster builder | not yet built | 현재 코드에는 disease cluster 전용 builder/service/contract가 없다. |
| cluster별 review-needed / evidence anchor 요약 | not yet built | `medical_analysis_report_schema_v2.md`에서 정의했지만 실제 구현된 cluster summary object는 없다. |

## 4. disclosure-review overview

| 세부 항목 | 상태 | repository-grounded reason |
| --- | --- | --- |
| 보험가입일 입력 저장 | already supported | `patientInputSchema`, `CasePatientInput.insuranceJoinDate`, `patient-input` API route가 존재한다. |
| 보험가입일을 OCR 대상에서 제외하는 정책 | already supported | 문서 계약과 현재 validation baseline에서 강하게 고정되어 있고, extraction 보호 규칙으로 유지된다. |
| 가입일 대비 candidate event 분류 엔진 | not yet built | 현재 코드에 `relativeWindow`, `candidateEvents`, `windowPolicy`를 계산하는 disclosure engine 구현은 없다. |
| Starter용 고지의무 overview block | not yet built | 새 스키마 문서는 있으나 이를 구성하는 service/output layer는 아직 없다. |
| Pro용 deeper candidate review | not yet built | 고지의무 후보 상세 reasoning과 evidence drill-down을 묶는 전용 구현이 아직 없다. |

## 5. final summary / export

| 세부 항목 | 상태 | repository-grounded reason |
| --- | --- | --- |
| narrative / PDF export 기반 | already supported | `consumer-report-export-service.ts`, `investigator-report-export-service.ts`, `pdf-builder.ts`가 narrative PDF export를 제공한다. |
| compact final summary derived output | partially supported | export infrastructure는 있으나, 새 `final_summary_output_rule.md`에 맞는 planner-facing compact summary assembler는 아직 없다. |
| Starter 공유용 summary | partially supported | consumer report/narrative/pdf 흐름이 유사 기반은 되지만, Starter 문구/구조/경고 규칙은 아직 별도 구현되지 않았다. |
| Pro 상세 export | partially supported | investigator report/narrative/pdf가 기반은 있지만 Pro 심층 분석 spec 전체를 반영하지는 않는다. |

## 6. Pro deep analysis

| 세부 항목 | 상태 | repository-grounded reason |
| --- | --- | --- |
| review-signal propagation | already supported | slice1/2로 `bundleQualityState`, review signals, narrative propagation이 이미 구현됐다. |
| stronger evidence drill-down foundation | partially supported | case-level evidence route는 존재하지만 `event-bundles/[bundleId]/evidence`는 placeholder 상태다. |
| selective vision cross-check orchestration | not yet built | 문서에는 있으나, 현재 Pro 전용 selective vision 실행 경로는 없다. |
| 질환군별 심층 해석 결과 | not yet built | cluster/deep analysis builder가 아직 없다. |
| Pro 전용 결과 조립 | not yet built | 현재 구현은 investigator output 기반이며, Pro spec에 맞는 planner-facing deep result 조립은 아직 없다. |

## 7. Pro question / search

| 세부 항목 | 상태 | repository-grounded reason |
| --- | --- | --- |
| Pro 질문 / 검색 / 재질문 기능 | not yet built | 관련 spec은 문서에 있지만 질문 엔진, 검색 service, follow-up session path는 현재 코드에 없다. |
| evidence-grounded answer runtime | not yet built | 질문 답변을 evidence anchor와 함께 반환하는 API/contract가 아직 없다. |

## 8. signup / social login

| 세부 항목 | 상태 | repository-grounded reason |
| --- | --- | --- |
| 이메일/비밀번호 sign-up | partially supported | `api/auth/sign-up`와 `sign-in` route가 존재한다. |
| 이름 + 이메일 중심 단순 planner signup | partially supported | signup은 구현돼 있지만 현재 payload는 `phone`, `role`, old investigator verification fields를 요구해 새 방향보다 무겁다. |
| Google / Kakao social login | not yet built | 현재 앱 코드에 실제 Google/Kakao OAuth flow handler는 없다. |
| planner/admin 단순 역할 모델 정렬 | not yet built | 코드와 Prisma는 여전히 `consumer / investigator / admin` 구조를 중심으로 동작한다. |

## 9. billing / subscription

| 세부 항목 | 상태 | repository-grounded reason |
| --- | --- | --- |
| Plan / Subscription DB 구조 | already supported | Prisma schema에 `Plan`, `Subscription`, `UsageLedger`가 존재한다. |
| plan catalog / admin-side assignment | partially supported | `plan-catalog.ts`, `admin-access-service.ts`가 catalog upsert와 수동 subscription assignment를 지원한다. |
| 실제 결제 provider 연동 | not yet built | Stripe 등 checkout / webhook / billing provider integration은 현재 코드에 없다. |
| planner-facing Starter / Pro entitlement gating | partially supported | 플랜 개념은 있으나 현재 catalog와 role 모델은 old `consumer / investigator / Studio` 구조를 유지한다. |

## 핵심 해석

### 이미 엔진에 실질적으로 있는 것

- 업로드 → OCR → 날짜/엔티티/윈도우/atom/bundle 파이프라인
- evidence 기반 구조
- weak evidence / review-needed honest signaling
- investigator-style structured output / report / narrative / PDF export 기반

### 절반쯤 있는 것

- timeline 출력
- export 인프라
- Pro용 review signal 전달
- 이메일 기반 auth
- subscription 데이터 구조

### 아직 비어 있는 것

- planner-facing 공통 분석 스키마 구현
- disease cluster output
- disclosure-review engine
- Starter 전용 결과 조립
- Pro deep analysis result
- Pro 질문/검색
- Google/Kakao 로그인
- 실제 billing

## 제품 관점 한 줄 요약

현재 저장소는 “코어 분석 엔진과 investigator-style honest output 기반”은 꽤 앞서 있다.

하지만 “설계사가 바로 쓰는 Starter / Pro 결과 체계”는 아직 adapter와 조립 레이어가 부족하다.
