# API 계약서 v1

## 1. 설계 원칙
- REST 우선
- long-running job는 async
- 입력 검증은 request boundary 에서 수행
- 핵심 응답은 JSON schema 고정
- API는 자기 자신에게 fetch 하지 않는다

## 2. 인증
- POST `/api/auth/sign-up`
- POST `/api/auth/sign-in`
- POST `/api/auth/sign-out`
- POST `/api/auth/role-request`
- GET `/api/auth/me`

## 3. 케이스
- POST `/api/cases`
- GET `/api/cases`
- GET `/api/cases/:caseId`
- PATCH `/api/cases/:caseId`
- DELETE `/api/cases/:caseId`

## 4. 환자/가입일 입력
### PUT `/api/cases/:caseId/patient-input`
```json
{
  "patientName": "홍길동",
  "birthDate": "1984-01-01",
  "insuranceJoinDate": "2022-01-01",
  "insuranceCompany": "OO보험",
  "productType": "실손"
}
```

## 5. 문서 업로드
- POST `/api/cases/:caseId/documents`
- GET `/api/cases/:caseId/documents`
- DELETE `/api/documents/:documentId`

업로드 응답:
```json
{
  "documentId": "doc_1",
  "fileOrder": 1,
  "status": "uploaded"
}
```

## 6. OCR
- POST `/api/cases/:caseId/jobs/ocr`
- GET `/api/jobs/:jobId`
- GET `/api/cases/:caseId/ocr/blocks`

## 7. 날짜-이벤트 추출
- POST `/api/cases/:caseId/jobs/extract`
- GET `/api/cases/:caseId/date-candidates`
- GET `/api/cases/:caseId/event-atoms`
- GET `/api/cases/:caseId/event-bundles`

## 8. 정밀분석
### POST `/api/cases/:caseId/jobs/precision`
```json
{
  "mode": "manual_upgrade | investigator_recommended",
  "targetPageOrders": [3, 4, 8]
}
```

응답:
```json
{
  "jobId": "job_precision_1",
  "recommended": true
}
```

## 9. 보고서
- POST `/api/cases/:caseId/jobs/report`
- GET `/api/cases/:caseId/reports`
- GET `/api/reports/:reportId`
- GET `/api/reports/:reportId/export?format=pdf`
- GET `/api/reports/:reportId/slots`

## 10. evidence
- GET `/api/cases/:caseId/evidence`
- GET `/api/event-bundles/:bundleId/evidence`

응답 예시:
```json
{
  "items": [
    {
      "evidenceId": "ev_1",
      "sourceFileId": "doc_1",
      "fileOrder": 1,
      "pageOrder": 11,
      "blockIndex": 418,
      "bbox": { "xMin": 0.12, "yMin": 0.33, "xMax": 0.84, "yMax": 0.51 },
      "quote": "2024-06-20 ... 조직검사 결과 확인 위해 내원"
    }
  ]
}
```

## 11. 일반사용자 결과
### GET `/api/cases/:caseId/consumer-summary`
```json
{
  "majorDates": [],
  "riskSignals": [],
  "checkPoints": [],
  "upgradeSuggested": true
}
```

## 12. 플랜 / 사용량
- GET `/api/plans`
- GET `/api/me/subscription`
- GET `/api/me/usage`
- POST `/api/cases/:caseId/upgrade-check`

## 13. 전문가연결
- POST `/api/cases/:caseId/connection-requests`
- GET `/api/me/connection-requests`

## 14. 관리자
- GET `/api/admin/users`
- PATCH `/api/admin/users/:userId/plan`
- PATCH `/api/admin/users/:userId/status`
- GET `/api/admin/jobs`
- POST `/api/admin/jobs/:jobId/retry`
- GET `/api/admin/usage`
- GET `/api/admin/connection-requests`

## 15. 에러 응답 형식
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "insuranceJoinDate is required",
    "details": {}
  }
}
```

## 16. 성공 응답 공통 필드
```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_xxx"
  }
}
```
