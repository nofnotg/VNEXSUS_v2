import { ApiError, UserRole } from "@vnexus/shared";
import { prisma } from "../../prisma";
import { getCaseForUser } from "./case-service";

function mapEvidenceRecordToResponse(item: {
  id: string;
  caseId: string;
  sourceFileId: string;
  sourcePageId: string;
  fileOrder: number;
  pageOrder: number;
  evidenceKind: "ocr_block" | "merged_window" | "page_region";
  blockIndexStart: number | null;
  blockIndexEnd: number | null;
  bboxJson: unknown;
  quote: string;
  contextBefore: string | null;
  contextAfter: string | null;
  confidence: number | null;
  createdAt: Date;
}) {
  return {
    evidenceId: item.id,
    caseId: item.caseId,
    sourceFileId: item.sourceFileId,
    sourcePageId: item.sourcePageId,
    fileOrder: item.fileOrder,
    pageOrder: item.pageOrder,
    evidenceKind: item.evidenceKind,
    blockIndexStart: item.blockIndexStart ?? undefined,
    blockIndexEnd: item.blockIndexEnd ?? undefined,
    bbox: item.bboxJson ?? undefined,
    quote: item.quote,
    contextBefore: item.contextBefore ?? undefined,
    contextAfter: item.contextAfter ?? undefined,
    confidence: item.confidence ?? undefined,
    createdAt: item.createdAt.toISOString()
  };
}

export async function listEvidenceForCase(caseId: string, userId: string, role: UserRole) {
  await getCaseForUser(caseId, userId, role);

  // Retrieval rule: Epic 1 exposes stored evidence records in stable upload order.
  // Generation rule is separate and remains centered on OCR block evidence creation.
  const items = await prisma.evidenceRef.findMany({
    where: { caseId },
    orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { blockIndexStart: "asc" }, { blockIndexEnd: "asc" }]
  });

  return {
    items: items.map(mapEvidenceRecordToResponse)
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
