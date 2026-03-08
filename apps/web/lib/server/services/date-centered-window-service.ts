import { Prisma } from "@prisma/client";
import { aggregateDateCenteredWindows } from "@vnexus/domain";
import { ApiError, dateCenteredWindowResponseContractSchema, type UserRole } from "@vnexus/shared";
import { prisma } from "../../prisma";
import { getCaseForUser } from "./case-service";

export async function buildAndPersistDateCenteredWindows(caseId: string) {
  const [dateCandidates, entityCandidates, ocrBlocks] = await Promise.all([
    prisma.dateCandidate.findMany({
      where: { caseId },
      orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { blockIndex: "asc" }]
    }),
    prisma.entityCandidate.findMany({
      where: { caseId },
      orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { blockIndex: "asc" }]
    }),
    prisma.ocrBlock.findMany({
      where: { caseId },
      orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { blockIndex: "asc" }]
    })
  ]);

  if (dateCandidates.length === 0) {
    throw new ApiError("CONFLICT", "No DateCandidates available for date-centered windows", { caseId });
  }

  if (ocrBlocks.length === 0) {
    throw new ApiError("CONFLICT", "No OCR blocks available for date-centered windows", { caseId });
  }

  const windows = aggregateDateCenteredWindows({
    dateCandidates: dateCandidates.map((candidate) => ({
      id: candidate.id,
      caseId: candidate.caseId,
      sourceFileId: candidate.sourceFileId,
      sourcePageId: candidate.sourcePageId,
      fileOrder: candidate.fileOrder,
      pageOrder: candidate.pageOrder,
      blockIndex: candidate.blockIndex,
      rawDateText: candidate.rawDateText,
      normalizedDate: candidate.normalizedDate,
      dateTypeCandidate: candidate.dateTypeCandidate,
      confidence: candidate.confidence,
      createdAt: candidate.createdAt.toISOString()
    })),
    entityCandidates: entityCandidates.map((candidate) => ({
      id: candidate.id,
      caseId: candidate.caseId,
      sourceFileId: candidate.sourceFileId,
      sourcePageId: candidate.sourcePageId,
      relatedDateCandidateId: candidate.relatedDateCandidateId,
      fileOrder: candidate.fileOrder,
      pageOrder: candidate.pageOrder,
      blockIndex: candidate.blockIndex,
      candidateType: candidate.candidateType,
      rawText: candidate.rawText,
      normalizedText: candidate.normalizedText,
      confidence: candidate.confidence,
      metadataJson:
        candidate.metadataJson && typeof candidate.metadataJson === "object" && !Array.isArray(candidate.metadataJson)
          ? (candidate.metadataJson as Record<string, unknown>)
          : null,
      createdAt: candidate.createdAt.toISOString()
    }))
  });

  await prisma.$transaction(async (tx) => {
    await tx.dateCenteredWindow.deleteMany({
      where: { caseId }
    });

    if (windows.length > 0) {
      await tx.dateCenteredWindow.createMany({
        data: windows.map((window) => ({
          caseId: window.caseId,
          dateCandidateId: window.dateCandidateId,
          sourceFileId: window.sourceFileId,
          sourcePageId: window.sourcePageId,
          canonicalDate: window.canonicalDate,
          fileOrder: window.fileOrder,
          pageOrder: window.pageOrder,
          anchorBlockIndex: window.anchorBlockIndex,
          windowStartBlockIndex: window.windowStartBlockIndex,
          windowEndBlockIndex: window.windowEndBlockIndex,
          candidateSummaryJson: window.candidateSummaryJson as Prisma.InputJsonValue
        }))
      });
    }
  });

  return {
    caseId,
    windowCount: windows.length
  };
}

export async function listDateCenteredWindows(caseId: string, userId: string, role: UserRole) {
  await getCaseForUser(caseId, userId, role);

  const windows = await prisma.dateCenteredWindow.findMany({
    where: { caseId },
    orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { anchorBlockIndex: "asc" }, { createdAt: "asc" }]
  });

  return windows.map((window) =>
    dateCenteredWindowResponseContractSchema.parse({
      id: window.id,
      caseId: window.caseId,
      dateCandidateId: window.dateCandidateId,
      sourceFileId: window.sourceFileId,
      sourcePageId: window.sourcePageId,
      canonicalDate: window.canonicalDate,
      fileOrder: window.fileOrder,
      pageOrder: window.pageOrder,
      anchorBlockIndex: window.anchorBlockIndex,
      windowStartBlockIndex: window.windowStartBlockIndex,
      windowEndBlockIndex: window.windowEndBlockIndex,
      candidateSummaryJson: window.candidateSummaryJson,
      createdAt: window.createdAt.toISOString()
    })
  );
}
