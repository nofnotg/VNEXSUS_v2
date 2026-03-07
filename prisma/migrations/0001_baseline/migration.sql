-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('consumer', 'investigator', 'admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "InvestigatorVerificationStatus" AS ENUM ('not_requested', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "OrganizationMembershipRole" AS ENUM ('owner', 'member', 'reviewer');

-- CreateEnum
CREATE TYPE "PlanAudience" AS ENUM ('consumer', 'investigator');

-- CreateEnum
CREATE TYPE "PlanBillingType" AS ENUM ('one_time', 'credit', 'subscription');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('inactive', 'active', 'past_due', 'canceled', 'trialing');

-- CreateEnum
CREATE TYPE "UsageMetricType" AS ENUM ('ocr_page', 'precision_page', 'export', 'connection_request', 'case_helper_invocation');

-- CreateEnum
CREATE TYPE "CaseAudience" AS ENUM ('consumer', 'investigator');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('draft', 'uploaded', 'processing', 'ready', 'review_required', 'archived');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('visit', 'exam', 'result', 'pathology', 'surgery', 'admission', 'discharge', 'prescription', 'followup', 'history');

-- CreateEnum
CREATE TYPE "EventFamily" AS ENUM ('outpatient', 'inpatient', 'surgery', 'major_exam', 'pathology', 'followup');

-- CreateEnum
CREATE TYPE "EvidenceRelationType" AS ENUM ('primary', 'supporting');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('consumer_summary', 'investigator_report');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('draft', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "AnalysisJobType" AS ENUM ('ocr', 'extraction', 'precision', 'report', 'export');

-- CreateEnum
CREATE TYPE "AnalysisJobStatus" AS ENUM ('queued', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "ReviewSeverity" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "ConnectionRequestStatus" AS ENUM ('requested', 'reviewing', 'matched', 'closed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "authProvider" TEXT,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "phone" TEXT,
    "roleDetail" TEXT,
    "investigatorVerificationStatus" "InvestigatorVerificationStatus" NOT NULL DEFAULT 'not_requested',
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationMembershipRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "audience" "PlanAudience" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "billingType" "PlanBillingType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "billingProvider" TEXT,
    "externalSubscriptionId" TEXT,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseId" TEXT,
    "metricType" "UsageMetricType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCostSnapshot" DECIMAL(10,2),
    "ocrPagesUsed" INTEGER NOT NULL DEFAULT 0,
    "precisionAnalysisPagesUsed" INTEGER NOT NULL DEFAULT 0,
    "caseHelperInvocations" INTEGER NOT NULL DEFAULT 0,
    "exportsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "UsageLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "audience" "CaseAudience" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CasePatientInput" (
    "caseId" TEXT NOT NULL,
    "patientName" TEXT,
    "birthDate" TIMESTAMP(3),
    "insuranceJoinDate" TIMESTAMP(3),
    "insuranceCompany" TEXT,
    "productType" TEXT,
    "notes" TEXT,
    "inputSnapshotJson" JSONB,

    CONSTRAINT "CasePatientInput_pkey" PRIMARY KEY ("caseId")
);

-- CreateTable
CREATE TABLE "SourceDocument" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "fileOrder" INTEGER NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourcePage" (
    "id" TEXT NOT NULL,
    "sourceFileId" TEXT NOT NULL,
    "pageOrder" INTEGER NOT NULL,
    "imagePath" TEXT,
    "width" INTEGER,
    "height" INTEGER,

    CONSTRAINT "SourcePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcrBlock" (
    "id" TEXT NOT NULL,
    "sourceFileId" TEXT NOT NULL,
    "sourcePageId" TEXT NOT NULL,
    "fileOrder" INTEGER NOT NULL,
    "pageOrder" INTEGER NOT NULL,
    "blockIndex" INTEGER NOT NULL,
    "textRaw" TEXT NOT NULL,
    "textNormalized" TEXT NOT NULL,
    "bboxJson" JSONB,
    "confidence" DOUBLE PRECISION,

    CONSTRAINT "OcrBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateCandidate" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "sourceFileId" TEXT NOT NULL,
    "pageOrder" INTEGER NOT NULL,
    "blockIndex" INTEGER NOT NULL,
    "rawDateText" TEXT NOT NULL,
    "normalizedDate" TIMESTAMP(3),
    "dateTypeCandidate" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "metadataJson" JSONB,

    CONSTRAINT "DateCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceRef" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "sourceFileId" TEXT NOT NULL,
    "sourcePageId" TEXT,
    "fileOrder" INTEGER NOT NULL,
    "pageOrder" INTEGER NOT NULL,
    "blockIndex" INTEGER,
    "bboxJson" JSONB,
    "quote" TEXT NOT NULL,
    "contextBefore" TEXT,
    "contextAfter" TEXT,
    "confidence" DOUBLE PRECISION,

    CONSTRAINT "EvidenceRef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAtom" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "eventBundleId" TEXT,
    "canonicalDate" TIMESTAMP(3),
    "eventType" "EventType" NOT NULL,
    "hospital" TEXT,
    "department" TEXT,
    "payloadJson" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventAtom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBundle" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "canonicalDate" TIMESTAMP(3) NOT NULL,
    "eventFamily" "EventFamily" NOT NULL,
    "hospital" TEXT,
    "slotSeedJson" JSONB,
    "ambiguityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requiresReview" BOOLEAN NOT NULL DEFAULT false,
    "groupingStrategy" TEXT,
    "bundleReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBundleEvidenceRef" (
    "eventBundleId" TEXT NOT NULL,
    "evidenceRefId" TEXT NOT NULL,
    "relationType" "EvidenceRelationType" NOT NULL,

    CONSTRAINT "EventBundleEvidenceRef_pkey" PRIMARY KEY ("eventBundleId","evidenceRefId")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ReportStatus" NOT NULL,
    "reportJson" JSONB,
    "reportText" TEXT,
    "generatedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSlot" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "bundleId" TEXT,
    "slotName" TEXT NOT NULL,
    "slotValue" JSONB NOT NULL,
    "metadataJson" JSONB,

    CONSTRAINT "ReportSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisJob" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "jobType" "AnalysisJobType" NOT NULL,
    "status" "AnalysisJobStatus" NOT NULL,
    "requestedBy" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "AnalysisJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewFlag" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "bundleId" TEXT,
    "severity" "ReviewSeverity" NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "reasonText" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ReviewFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "agreedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" "ConnectionRequestStatus" NOT NULL,
    "summarySnapshotJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_organizationId_userId_key" ON "Membership"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE INDEX "UsageLedger_userId_createdAt_idx" ON "UsageLedger"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SourceDocument_caseId_fileOrder_key" ON "SourceDocument"("caseId", "fileOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SourcePage_sourceFileId_pageOrder_key" ON "SourcePage"("sourceFileId", "pageOrder");

-- CreateIndex
CREATE INDEX "OcrBlock_sourceFileId_pageOrder_blockIndex_idx" ON "OcrBlock"("sourceFileId", "pageOrder", "blockIndex");

-- CreateIndex
CREATE UNIQUE INDEX "OcrBlock_sourceFileId_pageOrder_blockIndex_key" ON "OcrBlock"("sourceFileId", "pageOrder", "blockIndex");

-- CreateIndex
CREATE INDEX "DateCandidate_caseId_normalizedDate_idx" ON "DateCandidate"("caseId", "normalizedDate");

-- CreateIndex
CREATE INDEX "EvidenceRef_caseId_pageOrder_blockIndex_idx" ON "EvidenceRef"("caseId", "pageOrder", "blockIndex");

-- CreateIndex
CREATE INDEX "EventAtom_caseId_canonicalDate_idx" ON "EventAtom"("caseId", "canonicalDate");

-- CreateIndex
CREATE INDEX "EventBundle_caseId_canonicalDate_idx" ON "EventBundle"("caseId", "canonicalDate");

-- CreateIndex
CREATE UNIQUE INDEX "Report_caseId_reportType_version_key" ON "Report"("caseId", "reportType", "version");

-- CreateIndex
CREATE INDEX "AnalysisJob_caseId_status_jobType_idx" ON "AnalysisJob"("caseId", "status", "jobType");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageLedger" ADD CONSTRAINT "UsageLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageLedger" ADD CONSTRAINT "UsageLedger_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasePatientInput" ADD CONSTRAINT "CasePatientInput_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceDocument" ADD CONSTRAINT "SourceDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourcePage" ADD CONSTRAINT "SourcePage_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrBlock" ADD CONSTRAINT "OcrBlock_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrBlock" ADD CONSTRAINT "OcrBlock_sourcePageId_fkey" FOREIGN KEY ("sourcePageId") REFERENCES "SourcePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateCandidate" ADD CONSTRAINT "DateCandidate_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateCandidate" ADD CONSTRAINT "DateCandidate_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceRef" ADD CONSTRAINT "EvidenceRef_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceRef" ADD CONSTRAINT "EvidenceRef_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceRef" ADD CONSTRAINT "EvidenceRef_sourcePageId_fkey" FOREIGN KEY ("sourcePageId") REFERENCES "SourcePage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAtom" ADD CONSTRAINT "EventAtom_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAtom" ADD CONSTRAINT "EventAtom_eventBundleId_fkey" FOREIGN KEY ("eventBundleId") REFERENCES "EventBundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBundle" ADD CONSTRAINT "EventBundle_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBundleEvidenceRef" ADD CONSTRAINT "EventBundleEvidenceRef_eventBundleId_fkey" FOREIGN KEY ("eventBundleId") REFERENCES "EventBundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBundleEvidenceRef" ADD CONSTRAINT "EventBundleEvidenceRef_evidenceRefId_fkey" FOREIGN KEY ("evidenceRefId") REFERENCES "EvidenceRef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSlot" ADD CONSTRAINT "ReportSlot_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSlot" ADD CONSTRAINT "ReportSlot_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "EventBundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisJob" ADD CONSTRAINT "AnalysisJob_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewFlag" ADD CONSTRAINT "ReviewFlag_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewFlag" ADD CONSTRAINT "ReviewFlag_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "EventBundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

