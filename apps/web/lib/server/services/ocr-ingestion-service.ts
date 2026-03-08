import { Prisma } from "@prisma/client";
import { ApiError, ocrBlockSchema } from "@vnexus/shared";
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

function normalizeOcrText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

async function syncSourcePages(
  tx: {
    sourcePage: {
      findMany: typeof prisma.sourcePage.findMany;
      createMany: typeof prisma.sourcePage.createMany;
      deleteMany: typeof prisma.sourcePage.deleteMany;
    };
  },
  sourceFileId: string,
  actualPageCount: number
) {
  const existingPages = await tx.sourcePage.findMany({
    where: { sourceFileId },
    orderBy: { pageOrder: "asc" }
  });

  const expectedOrders = Array.from({ length: actualPageCount }, (_, index) => index + 1);
  const missingOrders = expectedOrders.filter(
    (pageOrder) => !existingPages.some((page) => page.pageOrder === pageOrder)
  );

  if (missingOrders.length > 0) {
    await tx.sourcePage.createMany({
      data: missingOrders.map((pageOrder) => ({
        sourceFileId,
        pageOrder
      }))
    });
  }

  const extraPageIds = existingPages
    .filter((page) => page.pageOrder > actualPageCount)
    .map((page) => page.id);

  if (extraPageIds.length > 0) {
    await tx.sourcePage.deleteMany({
      where: {
        id: { in: extraPageIds }
      }
    });
  }

  return tx.sourcePage.findMany({
    where: { sourceFileId },
    orderBy: { pageOrder: "asc" }
  });
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

      // Current provider contract is a flat block list, so Epic 1 persists page 1 only.
      // Multi-page parsing remains deferred until a later provider/parser contract.
      const actualPageCount = 1;

      await prisma.$transaction(async (tx) => {
        const pages = await syncSourcePages(tx, document.id, actualPageCount);
        const firstPage = pages[0];

        if (!firstPage) {
          throw new ApiError("CONFLICT", "No source page available for OCR block persistence", {
            sourceFileId: document.id
          });
        }

        await tx.ocrBlock.deleteMany({
          where: {
            sourceFileId: document.id
          }
        });

        const persistedBlocks = blocks.map((block, blockIndex) => {
          const parsed = ocrBlockSchema.parse({
            caseId: payload.caseId,
            sourceFileId: document.id,
            sourcePageId: firstPage.id,
            fileOrder: document.fileOrder,
            pageOrder: firstPage.pageOrder,
            blockIndex,
            textRaw: block.text,
            textNormalized: normalizeOcrText(block.text),
            bboxJson: block.bbox,
            confidence: block.confidence
          });

          return {
            caseId: parsed.caseId,
            sourceFileId: parsed.sourceFileId,
            sourcePageId: parsed.sourcePageId,
            fileOrder: parsed.fileOrder,
            pageOrder: parsed.pageOrder,
            blockIndex: parsed.blockIndex,
            textRaw: parsed.textRaw,
            textNormalized: parsed.textNormalized,
            bboxJson: parsed.bboxJson ?? Prisma.JsonNull,
            confidence: parsed.confidence ?? null
          };
        });

        if (persistedBlocks.length > 0) {
          await tx.ocrBlock.createMany({
            data: persistedBlocks
          });
        }

        await tx.sourceDocument.update({
          where: { id: document.id },
          data: {
            pageCount: actualPageCount
          }
        });
      });

      console.log("[ocr-ingestion-skeleton]", {
        jobId,
        sourceDocumentId: document.id,
        pageCount: actualPageCount,
        blockCount: blocks.length
      });
    }

    await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        completedAt: new Date(),
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
        completedAt: null,
        finishedAt: new Date(),
        errorMessage: message
      }
    });

    throw error;
  }
}
