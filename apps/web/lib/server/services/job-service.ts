import { createHash } from "node:crypto";
import {
  OcrIngestionJobPayload,
  ApiError,
  OcrJobCreateInput,
  UserRole,
  ocrBlockResponseContractSchema
} from "@vnexus/shared";
import { prisma } from "../../prisma";
import { getCaseForUser } from "./case-service";
import { isLocalDemoMode } from "../demo-mode";
import { getDemoLatestOcrJob, runDemoOcrPipeline } from "../demo-store";
import { runOcrIngestionSkeleton } from "./ocr-ingestion-service";

export const OCR_JOB_STATUS_TRANSITIONS = ["queued", "processing", "completed", "failed"] as const;

function buildOcrJobPayload(
  caseId: string,
  sourceDocumentIds: string[],
  fileOrders: number[],
  requestedByUserId: string,
  enqueueReason: OcrJobCreateInput["enqueueReason"]
): OcrIngestionJobPayload {
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
  if (isLocalDemoMode()) {
    const job = await runDemoOcrPipeline(caseId);
    return {
      jobId: job.jobId,
      documentCount: input.sourceDocumentIds.length,
      status: job.status,
      idempotentReused: false,
      payload: {
        caseId,
        sourceDocumentIds: input.sourceDocumentIds,
        fileOrders: [],
        requestedByUserId: userId,
        ingestionMode: "ocr",
        enqueueReason: input.enqueueReason,
        idempotencyKey: `demo-${job.jobId}`,
        allowedTransitions: [...OCR_JOB_STATUS_TRANSITIONS]
      }
    };
  }

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
      // Same caseId + same sourceDocumentIds + queued/processing means duplicate enqueue.
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

  const inlineResult = await runOcrIngestionSkeleton(job.id);

  return {
    jobId: job.id,
    documentCount: targetDocuments.length,
    status: inlineResult.status,
    idempotentReused: false,
    payload
  };
}

export async function getJob(jobId: string, userId: string, role: UserRole) {
  if (isLocalDemoMode()) {
    const job = await getDemoLatestOcrJob("demo-case-1");
    if (!job || job.jobId !== jobId) {
      throw new ApiError("NOT_FOUND", "Job not found");
    }

    return {
      jobId: job.jobId,
      caseId: "demo-case-1",
      status: job.status,
      jobType: "ocr",
      requestedBy: userId,
      createdAt: job.createdAt,
      updatedAt: job.completedAt ?? job.createdAt,
      completedAt: job.completedAt ?? null,
      payload: { mode: "demo" }
    };
  }

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
    completedAt: job.completedAt,
    payload: job.payloadJson
  };
}

export async function listOcrBlocks(caseId: string, userId: string, role: UserRole) {
  await getCaseForUser(caseId, userId, role);

  const blocks = await prisma.ocrBlock.findMany({
    where: {
      caseId
    },
    orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { blockIndex: "asc" }]
  });

  return blocks.map((block) =>
    ocrBlockResponseContractSchema.parse({
      id: block.id,
      caseId: block.caseId,
      sourceFileId: block.sourceFileId,
      sourcePageId: block.sourcePageId,
      fileOrder: block.fileOrder,
      pageOrder: block.pageOrder,
      blockIndex: block.blockIndex,
      textRaw: block.textRaw,
      textNormalized: block.textNormalized,
      bboxJson: block.bboxJson,
      confidence: block.confidence,
      createdAt: block.createdAt.toISOString()
    })
  );
}
