-- Forward-only corrective migration for EventAtom canonicalDate normalization.
-- This avoids further edits to 0008 history while re-asserting the final TEXT contract.

ALTER TABLE "EventAtom"
ALTER COLUMN "canonicalDate" TYPE TEXT
USING CASE
  WHEN "canonicalDate" IS NULL THEN '1970-01-01'
  ELSE LEFT("canonicalDate"::text, 10)
END;

UPDATE "EventAtom" AS ea
SET
  "sourceWindowId" = COALESCE(ea."sourceWindowId", dw."id"),
  "sourceFileId" = COALESCE(ea."sourceFileId", dw."sourceFileId"),
  "sourcePageId" = COALESCE(ea."sourcePageId", dw."sourcePageId"),
  "candidateSnapshotJson" = CASE
    WHEN ea."candidateSnapshotJson" IS NULL OR ea."candidateSnapshotJson" = '{}'::jsonb
      THEN dw."candidateSummaryJson"
    ELSE ea."candidateSnapshotJson"
  END
FROM "DateCenteredWindow" AS dw
WHERE ea."caseId" = dw."caseId"
  AND ea."canonicalDate" = dw."canonicalDate"
  AND (
    ea."sourceWindowId" IS NULL
    OR ea."sourceFileId" IS NULL
    OR ea."sourcePageId" IS NULL
    OR ea."candidateSnapshotJson" IS NULL
    OR ea."candidateSnapshotJson" = '{}'::jsonb
  );
