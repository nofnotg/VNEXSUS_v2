-- Epic 2-3 Date-centered candidate aggregation contract
CREATE TABLE "DateCenteredWindow" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "dateCandidateId" TEXT NOT NULL,
  "sourceFileId" TEXT NOT NULL,
  "sourcePageId" TEXT NOT NULL,
  "canonicalDate" TEXT NOT NULL,
  "fileOrder" INTEGER NOT NULL,
  "pageOrder" INTEGER NOT NULL,
  "anchorBlockIndex" INTEGER NOT NULL,
  "windowStartBlockIndex" INTEGER NOT NULL,
  "windowEndBlockIndex" INTEGER NOT NULL,
  "candidateSummaryJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DateCenteredWindow_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "DateCenteredWindow"
ADD CONSTRAINT "DateCenteredWindow_caseId_fkey"
FOREIGN KEY ("caseId") REFERENCES "Case"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DateCenteredWindow"
ADD CONSTRAINT "DateCenteredWindow_dateCandidateId_fkey"
FOREIGN KEY ("dateCandidateId") REFERENCES "DateCandidate"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DateCenteredWindow"
ADD CONSTRAINT "DateCenteredWindow_sourceFileId_fkey"
FOREIGN KEY ("sourceFileId") REFERENCES "SourceDocument"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DateCenteredWindow"
ADD CONSTRAINT "DateCenteredWindow_sourcePageId_fkey"
FOREIGN KEY ("sourcePageId") REFERENCES "SourcePage"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "DateCenteredWindow_caseId_fileOrder_pageOrder_anchorBlockIndex_idx"
ON "DateCenteredWindow"("caseId", "fileOrder", "pageOrder", "anchorBlockIndex");

CREATE INDEX "DateCenteredWindow_dateCandidateId_idx"
ON "DateCenteredWindow"("dateCandidateId");
