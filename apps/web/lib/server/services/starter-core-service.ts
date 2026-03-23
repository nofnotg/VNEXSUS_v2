import { buildStarterCoreResult } from "@vnexus/domain";
import { type UserRole } from "@vnexus/shared";
import { isLocalDemoMode } from "../demo-mode";
import { getDemoBundles, getDemoLatestOcrJob, listDemoDocuments } from "../demo-store";
import { getCaseForUser } from "./case-service";
import { listEventBundles } from "./event-bundle-service";

function resolveAnalysisTimestamp(value?: {
  completedAt?: Date | string | null;
  finishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
}) {
  const candidate =
    value?.completedAt ?? value?.finishedAt ?? value?.updatedAt ?? new Date().toISOString();

  return candidate instanceof Date ? candidate.toISOString() : candidate;
}

export async function getStarterCoreResult(caseId: string, userId: string, role: UserRole) {
  if (isLocalDemoMode()) {
    const [bundles, documents, latestJob] = await Promise.all([
      getDemoBundles(caseId),
      listDemoDocuments(caseId),
      getDemoLatestOcrJob(caseId)
    ]);

    return buildStarterCoreResult({
      caseId,
      insuranceJoinDate: null,
      sourceDocuments: documents.map((document) => ({
        id: document.documentId,
        originalFileName: document.originalFileName,
        fileOrder: document.fileOrder,
        pageCount: document.pageCount
      })),
      bundles,
      analysisTimestamp: resolveAnalysisTimestamp({
        completedAt: latestJob?.completedAt ?? null
      })
    });
  }

  const caseRecord = await getCaseForUser(caseId, userId, role);
  const bundles = await listEventBundles(caseId, userId, role);

  return buildStarterCoreResult({
    caseId: caseRecord.id,
    insuranceJoinDate: caseRecord.patientInput?.insuranceJoinDate?.toISOString().slice(0, 10) ?? null,
    sourceDocuments: caseRecord.sourceDocuments.map((document) => ({
      id: document.id,
      originalFileName: document.originalFileName,
      fileOrder: document.fileOrder,
      pageCount: document.pageCount
    })),
    bundles,
    analysisTimestamp: resolveAnalysisTimestamp(caseRecord.analysisJobs[0])
  });
}
