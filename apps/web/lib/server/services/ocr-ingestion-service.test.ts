import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  job: {
    id: "job-1",
    caseId: "case-1",
    jobType: "ocr",
    status: "queued",
    payloadJson: {
      caseId: "case-1",
      requestedByUserId: "user-1",
      sourceDocumentIds: ["doc-1"],
      fileOrders: [1],
      ingestionMode: "ocr"
    },
    startedAt: null as Date | null,
    finishedAt: null as Date | null,
    errorMessage: null as string | null
  },
  documents: [
    {
      id: "doc-1",
      caseId: "case-1",
      fileOrder: 1,
      storagePath: "gcs://vnexus-v2-documents/case-1/input.pdf"
    }
  ],
  readCalls: [] as string[],
  ocrCalls: [] as string[],
  shouldFailOcr: false
}));

vi.mock("../../prisma", () => ({
  prisma: {
    analysisJob: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => (where.id === state.job.id ? { ...state.job } : null)),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.job = { ...state.job, ...data };
        return state.job;
      })
    },
    sourceDocument: {
      findMany: vi.fn(async () => [...state.documents])
    }
  }
}));

vi.mock("../storage/factory", () => ({
  getStorageAdapter: vi.fn(() => ({
    readAsBase64: vi.fn(async (storagePath: string) => {
      state.readCalls.push(storagePath);
      return "ZmFrZS1iYXNlNjQ=";
    })
  }))
}));

vi.mock("../ocr/provider", () => ({
  callOcrProvider: vi.fn(async (base64: string) => {
    if (state.shouldFailOcr) {
      throw new Error("ocr failed");
    }
    state.ocrCalls.push(base64);
    return [];
  })
}));

import { runOcrIngestionSkeleton } from "./ocr-ingestion-service";

describe("ocr ingestion skeleton", () => {
  beforeEach(() => {
    state.job = {
      id: "job-1",
      caseId: "case-1",
      jobType: "ocr",
      status: "queued",
      payloadJson: {
        caseId: "case-1",
        requestedByUserId: "user-1",
        sourceDocumentIds: ["doc-1"],
        fileOrders: [1],
        ingestionMode: "ocr"
      },
      startedAt: null,
      finishedAt: null,
      errorMessage: null
    };
    state.readCalls = [];
    state.ocrCalls = [];
    state.shouldFailOcr = false;
  });

  it("reads storagePath and calls OCR provider", async () => {
    const result = await runOcrIngestionSkeleton("job-1");

    expect(state.readCalls).toEqual(["gcs://vnexus-v2-documents/case-1/input.pdf"]);
    expect(state.ocrCalls).toEqual(["ZmFrZS1iYXNlNjQ="]);
    expect(result.status).toBe("completed");
  });

  it("marks job as failed when OCR provider throws", async () => {
    state.shouldFailOcr = true;

    await expect(runOcrIngestionSkeleton("job-1")).rejects.toThrow("ocr failed");
    expect(state.job.status).toBe("failed");
  });
});
