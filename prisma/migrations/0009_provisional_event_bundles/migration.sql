CREATE TYPE "BundleTypeCandidate" AS ENUM (
  'outpatient',
  'exam',
  'treatment',
  'procedure',
  'surgery',
  'admission',
  'discharge',
  'pathology',
  'mixed',
  'unknown'
);

ALTER TABLE "EventBundle"
  ADD COLUMN "fileOrder" INTEGER,
  ADD COLUMN "pageOrder" INTEGER,
  ADD COLUMN "primaryHospital" TEXT,
  ADD COLUMN "bundleTypeCandidate" "BundleTypeCandidate",
  ADD COLUMN "representativeDiagnosis" TEXT,
  ADD COLUMN "representativeTest" TEXT,
  ADD COLUMN "representativeTreatment" TEXT,
  ADD COLUMN "representativeProcedure" TEXT,
  ADD COLUMN "representativeSurgery" TEXT,
  ADD COLUMN "admissionStatus" TEXT,
  ADD COLUMN "unresolvedBundleSlotsJson" JSONB,
  ADD COLUMN "atomIdsJson" JSONB,
  ADD COLUMN "candidateSnapshotJson" JSONB;

ALTER TABLE "EventBundle"
  ALTER COLUMN "canonicalDate" TYPE TEXT
  USING TO_CHAR("canonicalDate", 'YYYY-MM-DD');

UPDATE "EventBundle"
SET
  "fileOrder" = COALESCE((
    SELECT MIN(a."fileOrder")
    FROM "EventAtom" a
    WHERE a."eventBundleId" = "EventBundle"."id"
  ), 1),
  "pageOrder" = COALESCE((
    SELECT MIN(a."pageOrder")
    FROM "EventAtom" a
    WHERE a."eventBundleId" = "EventBundle"."id"
  ), 1),
  "primaryHospital" = "hospital",
  "bundleTypeCandidate" = CASE
    WHEN "eventFamily" = 'surgery' THEN 'surgery'::"BundleTypeCandidate"
    WHEN "eventFamily" = 'pathology' THEN 'pathology'::"BundleTypeCandidate"
    WHEN "eventFamily" = 'major_exam' THEN 'exam'::"BundleTypeCandidate"
    WHEN "eventFamily" = 'followup' THEN 'outpatient'::"BundleTypeCandidate"
    WHEN "eventFamily" = 'inpatient' THEN 'admission'::"BundleTypeCandidate"
    ELSE 'outpatient'::"BundleTypeCandidate"
  END,
  "unresolvedBundleSlotsJson" = '{"hospitalConflict": false, "diagnosisConflict": false, "mixedAtomTypes": false, "weakGrouping": true, "needsManualReview": true, "notes": ["migrated from placeholder bundle schema"]}'::jsonb,
  "atomIdsJson" = COALESCE((
    SELECT jsonb_agg(a."id" ORDER BY a."fileOrder", a."pageOrder", a."anchorBlockIndex")
    FROM "EventAtom" a
    WHERE a."eventBundleId" = "EventBundle"."id"
  ), '[]'::jsonb),
  "candidateSnapshotJson" = COALESCE("slotSeedJson", '{"hospitals": [], "departments": [], "diagnoses": [], "tests": [], "treatments": [], "procedures": [], "surgeries": [], "admissions": [], "discharges": [], "pathologies": [], "medications": [], "symptoms": []}'::jsonb);

ALTER TABLE "EventBundle"
  ALTER COLUMN "fileOrder" SET NOT NULL,
  ALTER COLUMN "pageOrder" SET NOT NULL,
  ALTER COLUMN "bundleTypeCandidate" SET NOT NULL,
  ALTER COLUMN "unresolvedBundleSlotsJson" SET NOT NULL,
  ALTER COLUMN "atomIdsJson" SET NOT NULL,
  ALTER COLUMN "candidateSnapshotJson" SET NOT NULL;

ALTER TABLE "EventBundle"
  DROP COLUMN "eventFamily",
  DROP COLUMN "hospital",
  DROP COLUMN "slotSeedJson",
  DROP COLUMN "groupingStrategy",
  DROP COLUMN "bundleReason";

CREATE INDEX "EventBundle_caseId_fileOrder_pageOrder_createdAt_idx"
ON "EventBundle"("caseId", "fileOrder", "pageOrder", "createdAt");
