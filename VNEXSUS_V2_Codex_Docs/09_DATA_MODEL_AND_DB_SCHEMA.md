# 데이터 모델 및 DB 스키마 v1

## 1. 핵심 엔터티
- users
- profiles
- organizations
- memberships
- plans
- subscriptions
- usage_ledger
- cases
- case_patient_inputs
- source_documents
- source_pages
- ocr_blocks
- date_candidates
- event_atoms
- event_bundles
- evidence_refs
- reports
- report_slots
- analysis_jobs
- review_flags
- consents
- connection_requests

## 2. 테이블 정의(요약)
### users
- id
- email
- password_hash / auth_provider
- role (`consumer | investigator | admin`)
- status (`pending | active | suspended`)
- created_at
- updated_at

### profiles
- user_id
- display_name
- phone
- role_detail
- investigator_verification_status
- marketing_opt_in

### organizations
- id
- name
- type
- created_at

### memberships
- id
- organization_id
- user_id
- role (`owner | member | reviewer`)
- created_at

### plans
- id
- audience (`consumer | investigator`)
- code
- name
- billing_type (`one_time | credit | subscription`)
- is_active

### subscriptions
- id
- user_id
- plan_id
- status
- started_at
- ends_at
- billing_provider
- external_subscription_id

### usage_ledger
- id
- user_id
- case_id nullable
- metric_type (`ocr_page | precision_page | export | connection_request`)
- quantity
- unit_cost_snapshot
- created_at
- reason

### cases
- id
- owner_user_id
- audience (`consumer | investigator`)
- title
- status
- created_at
- updated_at

### case_patient_inputs
- case_id
- patient_name
- birth_date
- insurance_join_date
- insurance_company
- product_type
- notes
- input_snapshot_json

### source_documents
- id
- case_id
- original_file_name
- file_order
- page_count
- mime_type
- storage_path
- uploaded_at

### source_pages
- id
- source_file_id
- page_order
- image_path
- width
- height

### ocr_blocks
- id
- source_file_id
- source_page_id
- file_order
- page_order
- block_index
- text_raw
- text_normalized
- bbox_json
- confidence

### date_candidates
- id
- case_id
- source_file_id
- page_order
- block_index
- raw_date_text
- normalized_date
- date_type_candidate
- confidence
- metadata_json

### event_atoms
- id
- case_id
- canonical_date nullable
- event_type
- hospital
- department
- payload_json
- confidence
- created_at

### event_bundles
- id
- case_id
- canonical_date
- event_family
- hospital
- slot_seed_json
- ambiguity_score
- requires_review
- created_at

### evidence_refs
- id
- case_id
- source_file_id
- page_order
- block_index
- bbox_json
- quote
- context_before
- context_after
- confidence

### event_bundle_evidence_refs
- event_bundle_id
- evidence_ref_id
- relation_type (`primary | supporting`)

### reports
- id
- case_id
- report_type (`consumer_summary | investigator_report`)
- version
- status
- report_json
- report_text
- generated_at

### report_slots
- id
- report_id
- bundle_id
- slot_name
- slot_value
- metadata_json

### analysis_jobs
- id
- case_id
- job_type (`ocr | extraction | precision | report | export`)
- status
- requested_by
- started_at
- finished_at
- error_message

### review_flags
- id
- case_id
- bundle_id nullable
- severity (`low | medium | high`)
- reason_code
- reason_text
- resolved_at

### consents
- id
- user_id
- consent_type
- version
- agreed_at
- ip_address
- user_agent

### connection_requests
- id
- user_id
- case_id
- status (`requested | reviewing | matched | closed`)
- summary_snapshot_json
- created_at

## 3. 인덱스 권장
- ocr_blocks(case_id, page_order, block_index)
- date_candidates(case_id, normalized_date)
- event_bundles(case_id, canonical_date)
- evidence_refs(case_id, page_order)
- usage_ledger(user_id, created_at)
- reports(case_id, version)

## 4. 버전 전략
- 보고서는 versioned
- 환자 입력은 snapshot 보존
- prompt/analysis run도 로그 남김
- 재생성 시 overwrite 금지, 새 version 생성

## 5. 삭제 전략
- soft delete 우선
- 실제 파일 파기는 별도 파기 job
- 법적/운영상 보존 정책은 추후 문서 정밀화
