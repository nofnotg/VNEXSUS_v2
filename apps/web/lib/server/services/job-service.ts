import { createHash } from "node:crypto";
import { OcrJobPayload, ApiError, OcrJobCreateInput, UserRole } from "@vnexus/shared";
import { prisma } from "../../prisma";
import { getCaseForUser } from "./case-service";

export const OCR_JOB_STATUS_TRANSITIONS = ["queued", "processing", "completed", "failed"] as const;

function buildOcrJobPayload(
  caseId: string,
  sourceDocumentIds: string[],
  fileOrders: number[],
  requestedByUserId: string,
  enqueueReason: OcrJobCreateInput["enqueueReason"]
): OcrJobPayload {
  const normalizedIds = [...sourceDocumentIds].sort();
  const normalizedFileOrders = [...fileOrders].sort((a, b) => a - b);
  const idempotencyKey = createHash("sha256")
    .update(`${caseId}:${normalizedIds.join(",")}:${enqueueReason}`)
    .digest("hex");

  return {
    caseId,
    sourceDocumentIds: normalizedIds,
    fileOrders: normalizedFileOrders,
    requestedByUserId,
    ingestionMode: "ocr",
    enqueueReason,
    idempotencyKey,
    allowedTransitions: [...OCR_JOB_STATUS_TRANSITIONS]
  };
}

export async function createOcrJob(caseId: string, userId: string, role: UserRole, input: OcrJobCreateInput) {
  await getCaseForUser(caseId, userId, role);

  const targetDocuments = await prisma.sourceDocument.findMany({
    where: {
      caseId,
      id: { in: input.sourceDocumentIds }
    },
    orderBy: { fileOrder: "asc" }
  });

  if (targetDocuments.length === 0) {
    throw new ApiError("CONFLICT", "No source documents available for OCR");
  }

  if (targetDocuments.length !== input.sourceDocumentIds.length) {
    throw new ApiError("CONFLICT", "sourceDocumentIds must all belong to the target case");
  }

  const payload = buildOcrJobPayload(
    caseId,
    targetDocuments.map((document) => document.id),
    targetDocuments.map((document) => document.fileOrder),
    userId,
    input.enqueueReason
  );

  const existingJob = await prisma.analysisJob.findFirst({
    where: {
      caseId,
      jobType: "ocr",
      idempotencyKey: payload.idempotencyKey,
      status: { in: ["queued", "processing"] }
    },
    orderBy: [{ startedAt: "desc" }, { id: "desc" }]
  });

  if (existingJob) {
    return {
      jobId: existingJob.id,
      documentCount: payload.sourceDocumentIds.length,
      status: existingJob.status,
      idempotentReused: true,
      payload
    };
  }

  const job = await prisma.analysisJob.create({
    data: {
      caseId,
      jobType: "ocr",
      status: "queued",
      requestedBy: userId,
      idempotencyKey: payload.idempotencyKey,
      payloadJson: payload
    }
  });

  await prisma.case.update({
    where: { id: caseId },
    data: { status: "processing" }
  });

  return {
    jobId: job.id,
    documentCount: targetDocuments.length,
    status: job.status,
    idempotentReused: false,
    payload
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

  return {
    jobId: job.id,
    caseId: job.caseId,
    status: job.status,
    jobType: job.jobType,
    requestedBy: job.requestedBy,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    payload: job.payloadJson
  };
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
