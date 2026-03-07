-- Epic 1 ingestion/evidence contract hardening
CREATE TYPE "EvidenceKind" AS ENUM ('ocr_block', 'merged_window', 'page_region');

ALTER TABLE "EvidenceRef"
ADD COLUMN "evidenceKind" "EvidenceKind" NOT NULL DEFAULT 'ocr_block',
ADD COLUMN "blockIndexStart" INTEGER,
ADD COLUMN "blockIndexEnd" INTEGER,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "EvidenceRef"
ALTER COLUMN "sourcePageId" SET NOT NULL;

ALTER TABLE "AnalysisJob"
ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "payloadJson" JSONB,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "EvidenceRef_caseId_pageOrder_blockIndexStart_blockIndexEnd_idx"
ON "EvidenceRef"("caseId", "pageOrder", "blockIndexStart", "blockIndexEnd");

CREATE INDEX "AnalysisJob_caseId_jobType_idempotencyKey_idx"
ON "AnalysisJob"("caseId", "jobType", "idempotencyKey");
