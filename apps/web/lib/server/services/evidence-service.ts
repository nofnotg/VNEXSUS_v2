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
      evidenceKind: item.evidenceKind,
      blockIndex: item.blockIndex ?? undefined,
      blockIndexStart: item.blockIndexStart ?? undefined,
      blockIndexEnd: item.blockIndexEnd ?? undefined,
      bbox: item.bboxJson ?? undefined,
      quote: item.quote,
      contextBefore: item.contextBefore ?? undefined,
      contextAfter: item.contextAfter ?? undefined,
      confidence: item.confidence ?? undefined
    }))
  };
}

export async function listEvidenceForBundle(bundleId: string, userId: string, role: UserRole) {
  // Epic 1 placeholder only: EventBundle generation/linking is not implemented yet.
  // This route remains as a stub so the API surface matches the document contract
  // without pulling EventBundle construction into the ingestion phase.
  if (role !== "admin") {
    await prisma.case.findFirst({
      where: {
        ownerUserId: userId
      },
      select: { id: true }
    });
  }

  return {
    bundleId,
    placeholder: true,
    items: []
  };
}
