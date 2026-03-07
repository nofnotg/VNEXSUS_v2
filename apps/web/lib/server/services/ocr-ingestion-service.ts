import { ApiError } from "@vnexus/shared";
import { prisma } from "../../prisma";
import { getStorageAdapter } from "../storage/factory";
import { callOcrProvider } from "../ocr/provider";

type OcrIngestionJobPayload = {
  caseId: string;
  requestedByUserId: string;
  sourceDocumentIds: string[];
  fileOrders: number[];
  ingestionMode: "metadata-only" | "ocr";
};

function assertOcrPayload(payload: unknown): OcrIngestionJobPayload {
  if (!payload || typeof payload !== "object") {
    throw new ApiError("CONFLICT", "OCR job payload is missing");
  }

  const candidate = payload as Partial<OcrIngestionJobPayload>;
  if (
    !candidate.caseId ||
    !candidate.requestedByUserId ||
    !candidate.ingestionMode ||
    !Array.isArray(candidate.sourceDocumentIds) ||
    !Array.isArray(candidate.fileOrders)
  ) {
    throw new ApiError("CONFLICT", "OCR job payload is invalid");
  }

  return candidate as OcrIngestionJobPayload;
}

export async function runOcrIngestionSkeleton(jobId: string) {
  const job = await prisma.analysisJob.findUnique({
    where: { id: jobId }
  });

  if (!job || job.jobType !== "ocr") {
    throw new ApiError("NOT_FOUND", "OCR job not found");
  }

  const payload = assertOcrPayload(job.payloadJson);

  await prisma.analysisJob.update({
    where: { id: jobId },
    data: {
      status: "processing",
      startedAt: new Date()
    }
  });

  try {
    const storage = getStorageAdapter();
    const documents = await prisma.sourceDocument.findMany({
      where: {
        caseId: payload.caseId,
        id: { in: payload.sourceDocumentIds }
      },
      orderBy: { fileOrder: "asc" }
    });

    for (const document of documents) {
      const imageBase64 = await storage.readAsBase64(document.storagePath);
      const blocks = await callOcrProvider(imageBase64);
      console.log("[ocr-ingestion-skeleton]", {
        jobId,
        sourceDocumentId: document.id,
        blockCount: blocks.length
      });
    }

    await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        finishedAt: new Date(),
        errorMessage: null
      }
    });

    return {
      jobId,
      status: "completed" as const,
      sourceDocumentIds: payload.sourceDocumentIds
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OCR ingestion error";

    await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        finishedAt: new Date(),
        errorMessage: message
      }
    });

    throw error;
  }
}
