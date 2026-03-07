import { ApiError, OcrJobCreateInput, UserRole } from "@vnexus/shared";
import { prisma } from "../../prisma";
import { getCaseForUser } from "./case-service";

export async function createOcrJob(caseId: string, userId: string, role: UserRole, input: OcrJobCreateInput) {
  await getCaseForUser(caseId, userId, role);

  const targetDocuments = input.sourceDocumentIds?.length
    ? await prisma.sourceDocument.findMany({
        where: {
          caseId,
          id: { in: input.sourceDocumentIds }
        }
      })
    : await prisma.sourceDocument.findMany({ where: { caseId } });

  if (targetDocuments.length === 0) {
    throw new ApiError("CONFLICT", "No source documents available for OCR");
  }

  const job = await prisma.analysisJob.create({
    data: {
      caseId,
      jobType: "ocr",
      status: "queued",
      requestedBy: userId
    }
  });

  await prisma.case.update({
    where: { id: caseId },
    data: { status: "processing" }
  });

  return {
    jobId: job.id,
    documentCount: targetDocuments.length,
    status: job.status
  };
}

export async function getJob(jobId: string, userId: string, role: UserRole) {
  const job = await prisma.analysisJob.findFirst({
    where:
      role === "admin"
        ? { id: jobId }
        : {
            id: jobId,
            case: {
              ownerUserId: userId
            }
          },
    include: {
      case: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  if (!job) {
    throw new ApiError("NOT_FOUND", "Job not found");
  }

  return job;
}

export async function listOcrBlocks(caseId: string, userId: string, role: UserRole) {
  await getCaseForUser(caseId, userId, role);

  return prisma.ocrBlock.findMany({
    where: {
      sourceFile: {
        caseId
      }
    },
    orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { blockIndex: "asc" }]
  });
}
