import { ApiError, dateCandidateResponseContractSchema } from "@vnexus/shared";
import { extractDateCandidatesFromBlock } from "@vnexus/domain";
import { prisma } from "../../prisma";
import { getCaseForUser } from "./case-service";
import type { UserRole } from "@vnexus/shared";

export async function extractAndPersistDateCandidatesForDocument(caseId: string, sourceFileId: string) {
  const document = await prisma.sourceDocument.findFirst({
    where: {
      id: sourceFileId,
      caseId
    }
  });

  if (!document) {
    throw new ApiError("NOT_FOUND", "Source document not found for date extraction", {
      caseId,
      sourceFileId
    });
  }

  const blocks = await prisma.ocrBlock.findMany({
    where: {
      caseId,
      sourceFileId
    },
    orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { blockIndex: "asc" }]
  });

  const extractedCandidates = blocks.flatMap((block) =>
    extractDateCandidatesFromBlock({
      caseId,
      sourceFileId: block.sourceFileId,
      sourcePageId: block.sourcePageId,
      fileOrder: block.fileOrder,
      pageOrder: block.pageOrder,
      blockIndex: block.blockIndex,
      textRaw: block.textRaw
    })
  );

  await prisma.$transaction(async (tx) => {
    await tx.dateCandidate.deleteMany({
      where: {
        caseId,
        sourceFileId
      }
    });

    if (extractedCandidates.length > 0) {
      await tx.dateCandidate.createMany({
        data: extractedCandidates.map((candidate) => ({
          caseId: candidate.caseId,
          sourceFileId: candidate.sourceFileId,
          sourcePageId: candidate.sourcePageId,
          fileOrder: candidate.fileOrder,
          pageOrder: candidate.pageOrder,
          blockIndex: candidate.blockIndex,
          rawDateText: candidate.rawDateText,
          normalizedDate: candidate.normalizedDate,
          dateTypeCandidate: candidate.dateTypeCandidate,
          confidence: candidate.confidence
        }))
      });
    }
  });

  return {
    sourceFileId,
    candidateCount: extractedCandidates.length
  };
}

export async function listDateCandidates(caseId: string, userId: string, role: UserRole) {
  await getCaseForUser(caseId, userId, role);

  const candidates = await prisma.dateCandidate.findMany({
    where: { caseId },
    orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { blockIndex: "asc" }, { createdAt: "asc" }]
  });

  return candidates.map((candidate) =>
    dateCandidateResponseContractSchema.parse({
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
    })
  );
}
