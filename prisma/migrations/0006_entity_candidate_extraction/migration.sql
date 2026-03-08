-- Epic 2-2 EntityCandidate extraction contract
CREATE TYPE "EntityCandidateType" AS ENUM (
  'hospital',
  'department',
  'diagnosis',
  'test',
  'treatment',
  'procedure',
  'surgery',
  'admission',
  'discharge',
  'pathology',
  'medication',
  'symptom',
  'admin',
  'unknown'
);

CREATE TABLE "EntityCandidate" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "sourceFileId" TEXT NOT NULL,
  "sourcePageId" TEXT NOT NULL,
  "relatedDateCandidateId" TEXT,
  "fileOrder" INTEGER NOT NULL,
  "pageOrder" INTEGER NOT NULL,
  "blockIndex" INTEGER NOT NULL,
  "candidateType" "EntityCandidateType" NOT NULL,
  "rawText" TEXT NOT NULL,
  "normalizedText" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EntityCandidate_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "EntityCandidate"
ADD CONSTRAINT "EntityCandidate_caseId_fkey"
FOREIGN KEY ("caseId") REFERENCES "Case"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EntityCandidate"
ADD CONSTRAINT "EntityCandidate_sourceFileId_fkey"
FOREIGN KEY ("sourceFileId") REFERENCES "SourceDocument"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EntityCandidate"
ADD CONSTRAINT "EntityCandidate_sourcePageId_fkey"
FOREIGN KEY ("sourcePageId") REFERENCES "SourcePage"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EntityCandidate"
ADD CONSTRAINT "EntityCandidate_relatedDateCandidateId_fkey"
FOREIGN KEY ("relatedDateCandidateId") REFERENCES "DateCandidate"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "EntityCandidate_caseId_fileOrder_pageOrder_blockIndex_idx"
ON "EntityCandidate"("caseId", "fileOrder", "pageOrder", "blockIndex");

CREATE INDEX "EntityCandidate_caseId_candidateType_idx"
ON "EntityCandidate"("caseId", "candidateType");

CREATE INDEX "EntityCandidate_relatedDateCandidateId_idx"
ON "EntityCandidate"("relatedDateCandidateId");
