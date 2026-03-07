# V1 → V2 마이그레이션 계획

## 1. 목적
기존 레포의 모든 것을 그대로 옮기지 않고, 핵심 부품만 추출해 V2에 승격하기 위한 계획이다.

## 2. V1에서 살릴 자산
### 가장 중요
- postprocess/index.js
- medicalEventModel.js
- disclosureReportBuilder.js
- unifiedReportBuilder.js
- structuredReportGenerator.js
- structuredReportSchema.js
- enhancedPromptBuilder.js
- enhancedMassiveDateBlockProcessor.js
- 테스트/verify 스크립트
- sample result 구조

### 참고용
- MedicalTimelineGenerator.js
- insuranceValidationService.js
- medicalTermTranslationService.js
- aiServiceIntegration.js

## 3. V1에서 버릴 것
- `/api/generate-report` 내부 HTTP 재호출 구조
- 비대 라우트 파일
- 라우트 안의 후처리/저장/렌더링 혼재 구조
- stub 처리기 경로
- 실험 라우트가 본선 구조를 침범한 부분

## 4. V1 부품 매핑표
| V1 자산 | V2 목적지 | 조치 |
|---|---|---|
| `medicalEventModel.js` | `packages/domain/events` | 개념 승격, 재작성 |
| `unifiedReportBuilder.js` | `packages/domain/reports` | 출력 계약 참고 후 재작성 |
| `structuredReportSchema.js` | `packages/domain/reports/schema` | 구조 계승 |
| `enhancedPromptBuilder.js` | `packages/prompts` | 역할 분리 후 재구성 |
| verify scripts | `tests/golden` | 입력/출력 기준 변환 |
| sample-report-result.json | `tests/golden/expected` | 계약 참고 |

## 5. 이식 전략
1. 기존 코드를 복붙하지 않는다.
2. 핵심 개념과 규칙만 추출한다.
3. V2 계약에 맞는 타입/스키마를 먼저 만든다.
4. V1 로직은 테스트 케이스 참고용으로만 비교한다.
5. 작동하던 흔적보다 지속 가능한 구조를 우선한다.

## 6. 체크리스트
- [ ] 기존 핵심 로직 목록화
- [ ] 골든셋화 가능한 예제 추출
- [ ] V2 타입 계약 확정
- [ ] V1 기능과 V2 기능 매핑
- [ ] 재작성 대상/직접 재사용 대상 분리
- [ ] V1 의존 파일 제거 계획 수립
