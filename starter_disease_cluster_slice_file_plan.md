# Starter Disease Cluster Slice File Plan

## Expected Touched Files

- `packages/shared/src/validation/contracts.ts`
- `packages/domain/src/output/starter-disease-cluster-builder.ts`
- `packages/domain/src/output/starter-disease-cluster-builder.test.ts`
- `packages/domain/src/output/starter-core-builder.ts`
- `packages/domain/src/output/starter-core-builder.test.ts`
- `packages/domain/src/output/index.ts`
- `apps/web/lib/server/services/starter-core-service.ts`
- `apps/web/lib/server/services/starter-core-service.test.ts`

## Why Each Touched File Is Necessary

### `packages/shared/src/validation/contracts.ts`
- scope: shared/domain contract
- reason: define or extend the Starter cluster output contract and representative evidence reference shape

### `packages/domain/src/output/starter-disease-cluster-builder.ts`
- scope: domain
- reason: build the planner-facing cluster overview from existing engine outputs

### `packages/domain/src/output/starter-disease-cluster-builder.test.ts`
- scope: domain test
- reason: lock the cluster groups, `present/not_found/review_needed`, and evidence-grounded behavior

### `packages/domain/src/output/starter-core-builder.ts`
- scope: domain
- reason: attach the new disease-cluster overview to the accepted Starter result without widening beyond Starter

### `packages/domain/src/output/starter-core-builder.test.ts`
- scope: domain test
- reason: confirm Starter core still assembles correctly after the disease-cluster section is added

### `packages/domain/src/output/index.ts`
- scope: domain export surface
- reason: export the new builder through the existing domain boundary

### `apps/web/lib/server/services/starter-core-service.ts`
- scope: service
- reason: preserve service-level delivery of the expanded Starter result

### `apps/web/lib/server/services/starter-core-service.test.ts`
- scope: service test
- reason: prove the service path exposes disease-cluster overview without touching disclosure-review or Pro paths

## Files That Must Remain Untouched

- `packages/domain/src/dates/date-extraction.ts`
- `packages/domain/src/dates/date-extraction.test.ts`
- `apps/web/lib/server/services/date-extraction-service.ts`
- `apps/web/lib/server/services/date-extraction-service.test.ts`
- accepted slice1 artifacts
- accepted slice2 artifacts
- accepted Starter core acceptance artifacts
- disclosure-review docs and code
- Pro docs and code
- billing, auth, and social-login implementation files

## Rollback Boundary

If the slice fails, rollback should be limited to:

- Starter disease-cluster contract additions
- the dedicated disease-cluster builder
- narrow compatibility changes in Starter core builder and Starter core service
- related tests only

Rollback must not require touching:

- extraction logic
- slice1 or slice2 implementation
- accepted Starter core behavior outside narrow compatibility updates
