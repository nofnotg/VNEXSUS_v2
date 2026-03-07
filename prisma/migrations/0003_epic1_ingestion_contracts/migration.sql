-- Epic 1 ingestion/evidence contract hardening
CREATE TYPE "EvidenceKind" AS ENUM ('ocr_block', 'block_range', 'page_region');

ALTER TABLE "EvidenceRef"
ADD COLUMN "evidenceKind" "EvidenceKind" NOT NULL DEFAULT 'ocr_block',
ADD COLUMN "blockIndexStart" INTEGER,
ADD COLUMN "blockIndexEnd" INTEGER;

ALTER TABLE "AnalysisJob"
ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "payloadJson" JSONB;

CREATE INDEX "EvidenceRef_caseId_pageOrder_blockIndexStart_blockIndexEnd_idx"
ON "EvidenceRef"("caseId", "pageOrder", "blockIndexStart", "blockIndexEnd");

CREATE INDEX "AnalysisJob_caseId_jobType_idempotencyKey_idx"
ON "AnalysisJob"("caseId", "jobType", "idempotencyKey");
