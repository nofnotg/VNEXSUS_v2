import { Prisma } from "@prisma/client";
import { extractEntityCandidates } from "@vnexus/domain";
import { ApiError, entityCandidateResponseContractSchema, type UserRole } from "@vnexus/shared";
import { prisma } from "../../prisma";
import { getCaseForUser } from "./case-service";

export async function extractAndPersistEntityCandidates(caseId: string) {
  const [ocrBlocks, dateCandidates] = await Promise.all([
    prisma.ocrBlock.findMany({
      where: { caseId },
      orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { blockIndex: "asc" }]
    }),
    prisma.dateCandidate.findMany({
      where: { caseId },
      orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { blockIndex: "asc" }]
    })
  ]);

  if (ocrBlocks.length === 0) {
    throw new ApiError("CONFLICT", "No OCR blocks available for entity extraction", { caseId });
  }

  const extracted = extractEntityCandidates({
    ocrBlocks: ocrBlocks.map((block) => ({
      caseId: block.caseId,
      sourceFileId: block.sourceFileId,
      sourcePageId: block.sourcePageId,
      fileOrder: block.fileOrder,
      pageOrder: block.pageOrder,
      blockIndex: block.blockIndex,
      textRaw: block.textRaw,
      textNormalized: block.textNormalized
    })),
    dateCandidates: dateCandidates.map((candidate) => ({
      id: candidate.id,
      caseId: candidate.caseId,
      sourceFileId: candidate.sourceFileId,
      sourcePageId: candidate.sourcePageId,
      fileOrder: candidate.fileOrder,
      pageOrder: candidate.pageOrder,
      blockIndex: candidate.blockIndex
    }))
  });

  await prisma.$transaction(async (tx) => {
    await tx.entityCandidate.deleteMany({
      where: { caseId }
    });

    if (extracted.length > 0) {
      await tx.entityCandidate.createMany({
        data: extracted.map((candidate) => ({
          caseId: candidate.caseId,
          sourceFileId: candidate.sourceFileId,
          sourcePageId: candidate.sourcePageId,
          relatedDateCandidateId: candidate.relatedDateCandidateId ?? null,
          fileOrder: candidate.fileOrder,
          pageOrder: candidate.pageOrder,
          blockIndex: candidate.blockIndex,
          candidateType: candidate.candidateType,
          rawText: candidate.rawText,
          normalizedText: candidate.normalizedText,
          confidence: candidate.confidence,
          metadataJson: candidate.metadataJson
            ? (candidate.metadataJson as Prisma.InputJsonValue)
            : Prisma.JsonNull
        }))
      });
    }
  });

  return {
    caseId,
    candidateCount: extracted.length
  };
}

export async function listEntityCandidates(caseId: string, userId: string, role: UserRole) {
  await getCaseForUser(caseId, userId, role);

  const candidates = await prisma.entityCandidate.findMany({
    where: { caseId },
    orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { blockIndex: "asc" }, { createdAt: "asc" }]
  });

  return candidates.map((candidate) => {
    const rawMetadata = candidate.metadataJson as unknown;

    return entityCandidateResponseContractSchema.parse({
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
        rawMetadata === Prisma.JsonNull
          ? null
          : rawMetadata && typeof rawMetadata === "object" && !Array.isArray(rawMetadata)
            ? (rawMetadata as Record<string, unknown>)
          : null,
      createdAt: candidate.createdAt.toISOString()
    });
  });
}
