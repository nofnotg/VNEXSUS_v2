-- Epic 1 OCR block persistence and job completion contract
ALTER TABLE "OcrBlock"
ADD COLUMN "caseId" TEXT,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "OcrBlock" AS ob
SET "caseId" = sd."caseId"
FROM "SourceDocument" AS sd
WHERE ob."sourceFileId" = sd."id";

ALTER TABLE "OcrBlock"
ALTER COLUMN "caseId" SET NOT NULL;

ALTER TABLE "OcrBlock"
ADD CONSTRAINT "OcrBlock_caseId_fkey"
FOREIGN KEY ("caseId") REFERENCES "Case"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "OcrBlock_caseId_fileOrder_pageOrder_blockIndex_idx"
ON "OcrBlock"("caseId", "fileOrder", "pageOrder", "blockIndex");

ALTER TABLE "AnalysisJob"
ADD COLUMN "completedAt" TIMESTAMP(3);
