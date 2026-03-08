-- Epic 2 DateCandidate extraction contract
CREATE TYPE "DateTypeCandidate" AS ENUM (
  'visit',
  'exam',
  'report',
  'pathology',
  'surgery',
  'admission',
  'discharge',
  'plan',
  'admin',
  'irrelevant'
);

ALTER TABLE "DateCandidate"
ADD COLUMN "sourcePageId" TEXT,
ADD COLUMN "fileOrder" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "dateTypeCandidateV2" "DateTypeCandidate" NOT NULL DEFAULT 'visit';

UPDATE "DateCandidate" AS dc
SET
  "sourcePageId" = ob."sourcePageId",
  "fileOrder" = ob."fileOrder",
  "dateTypeCandidateV2" =
    CASE
      WHEN dc."dateTypeCandidate" IN ('visit', 'exam', 'report', 'pathology', 'surgery', 'admission', 'discharge', 'plan', 'admin', 'irrelevant')
        THEN dc."dateTypeCandidate"::"DateTypeCandidate"
      ELSE 'visit'::"DateTypeCandidate"
    END
FROM "OcrBlock" AS ob
WHERE dc."sourceFileId" = ob."sourceFileId"
  AND dc."pageOrder" = ob."pageOrder"
  AND dc."blockIndex" = ob."blockIndex";

ALTER TABLE "DateCandidate"
ALTER COLUMN "sourcePageId" SET NOT NULL;

ALTER TABLE "DateCandidate"
ALTER COLUMN "normalizedDate" TYPE TEXT USING
  CASE
    WHEN "normalizedDate" IS NULL THEN NULL
    ELSE TO_CHAR("normalizedDate", 'YYYY-MM-DD')
  END;

ALTER TABLE "DateCandidate"
DROP COLUMN "metadataJson",
DROP COLUMN "dateTypeCandidate";

ALTER TABLE "DateCandidate"
RENAME COLUMN "dateTypeCandidateV2" TO "dateTypeCandidate";

ALTER TABLE "DateCandidate"
ADD CONSTRAINT "DateCandidate_sourcePageId_fkey"
FOREIGN KEY ("sourcePageId") REFERENCES "SourcePage"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "DateCandidate_caseId_fileOrder_pageOrder_blockIndex_idx"
ON "DateCandidate"("caseId", "fileOrder", "pageOrder", "blockIndex");
