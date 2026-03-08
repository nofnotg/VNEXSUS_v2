-- Epic 2-4 provisional EventAtom contract
CREATE TYPE "EventTypeCandidate" AS ENUM (
  'outpatient',
  'exam',
  'treatment',
  'procedure',
  'surgery',
  'admission',
  'discharge',
  'pathology',
  'followup',
  'mixed',
  'unknown'
);

ALTER TABLE "EventAtom"
ADD COLUMN "sourceWindowId" TEXT,
ADD COLUMN "sourceFileId" TEXT,
ADD COLUMN "sourcePageId" TEXT,
ADD COLUMN "fileOrder" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "pageOrder" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "anchorBlockIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "primaryHospital" TEXT,
ADD COLUMN "primaryDepartment" TEXT,
ADD COLUMN "primaryDiagnosis" TEXT,
ADD COLUMN "primaryTest" TEXT,
ADD COLUMN "primaryTreatment" TEXT,
ADD COLUMN "primaryProcedure" TEXT,
ADD COLUMN "primarySurgery" TEXT,
ADD COLUMN "admissionStatus" TEXT,
ADD COLUMN "pathologySummary" TEXT,
ADD COLUMN "medicationSummary" TEXT,
ADD COLUMN "symptomSummary" TEXT,
ADD COLUMN "eventTypeCandidate" "EventTypeCandidate" NOT NULL DEFAULT 'unknown',
ADD COLUMN "ambiguityScore" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN "requiresReview" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "unresolvedSlotsJson" JSONB NOT NULL DEFAULT '{"hospitalMissing":true,"diagnosisMissing":true,"conflictingDiagnosis":false,"conflictingHospital":false,"weakEvidence":true,"needsManualReview":true,"notes":["migrated-from-placeholder"]}'::jsonb,
ADD COLUMN "candidateSnapshotJson" JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE "EventAtom" AS ea
SET
  "sourceWindowId" = dw."id",
  "sourceFileId" = dw."sourceFileId",
  "sourcePageId" = dw."sourcePageId",
  "canonicalDate" = dw."canonicalDate",
  "fileOrder" = dw."fileOrder",
  "pageOrder" = dw."pageOrder",
  "anchorBlockIndex" = dw."anchorBlockIndex",
  "primaryHospital" = ea."hospital",
  "primaryDepartment" = ea."department",
  "candidateSnapshotJson" = dw."candidateSummaryJson"
FROM "DateCenteredWindow" AS dw
WHERE ea."caseId" = dw."caseId"
  AND ea."canonicalDate"::text = dw."canonicalDate"
  AND ea."sourceWindowId" IS NULL;

ALTER TABLE "EventAtom"
ALTER COLUMN "sourceWindowId" SET NOT NULL,
ALTER COLUMN "sourceFileId" SET NOT NULL,
ALTER COLUMN "sourcePageId" SET NOT NULL,
ALTER COLUMN "canonicalDate" TYPE TEXT USING
  CASE
    WHEN "canonicalDate" IS NULL THEN '1970-01-01'
    ELSE TO_CHAR("canonicalDate", 'YYYY-MM-DD')
  END;

ALTER TABLE "EventAtom"
DROP COLUMN "eventType",
DROP COLUMN "hospital",
DROP COLUMN "department",
DROP COLUMN "payloadJson",
DROP COLUMN "confidence";

ALTER TABLE "EventAtom"
ADD CONSTRAINT "EventAtom_sourceWindowId_fkey"
FOREIGN KEY ("sourceWindowId") REFERENCES "DateCenteredWindow"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "EventAtom_caseId_fileOrder_pageOrder_anchorBlockIndex_idx"
ON "EventAtom"("caseId", "fileOrder", "pageOrder", "anchorBlockIndex");

CREATE INDEX "EventAtom_sourceWindowId_idx"
ON "EventAtom"("sourceWindowId");
