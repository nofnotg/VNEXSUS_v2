import { ApiError, UserRole } from "@vnexus/shared";
import { prisma } from "../../prisma";
import { getCaseForUser } from "./case-service";

export async function listEvidenceForCase(caseId: string, userId: string, role: UserRole) {
  await getCaseForUser(caseId, userId, role);

  const items = await prisma.evidenceRef.findMany({
    where: { caseId },
    orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { blockIndex: "asc" }]
  });

  return {
    items: items.map((item) => ({
      evidenceId: item.id,
      sourceFileId: item.sourceFileId,
      sourcePageId: item.sourcePageId ?? undefined,
      fileOrder: item.fileOrder,
      pageOrder: item.pageOrder,
      blockIndex: item.blockIndex ?? undefined,
      bbox: item.bboxJson ?? undefined,
      quote: item.quote,
      contextBefore: item.contextBefore ?? undefined,
      contextAfter: item.contextAfter ?? undefined,
      confidence: item.confidence ?? undefined
    }))
  };
}

export async function listEvidenceForBundle(bundleId: string, userId: string, role: UserRole) {
  const bundle = await prisma.eventBundle.findFirst({
    where:
      role === "admin"
        ? { id: bundleId }
        : {
            id: bundleId,
            case: {
              ownerUserId: userId
            }
          },
    include: {
      evidenceRefs: {
        include: {
          evidenceRef: true
        }
      }
    }
  });

  if (!bundle) {
    throw new ApiError("NOT_FOUND", "Event bundle not found");
  }

  return {
    items: bundle.evidenceRefs.map(({ evidenceRef }) => ({
      evidenceId: evidenceRef.id,
      sourceFileId: evidenceRef.sourceFileId,
      sourcePageId: evidenceRef.sourcePageId ?? undefined,
      fileOrder: evidenceRef.fileOrder,
      pageOrder: evidenceRef.pageOrder,
      blockIndex: evidenceRef.blockIndex ?? undefined,
      bbox: evidenceRef.bboxJson ?? undefined,
      quote: evidenceRef.quote,
      contextBefore: evidenceRef.contextBefore ?? undefined,
      contextAfter: evidenceRef.contextAfter ?? undefined,
      confidence: evidenceRef.confidence ?? undefined
    }))
  };
}
