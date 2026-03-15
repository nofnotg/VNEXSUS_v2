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
    completedAt: null as Date | null,
    finishedAt: null as Date | null,
    errorMessage: null as string | null
  },
  documents: [
    {
      id: "doc-1",
      caseId: "case-1",
      fileOrder: 1,
      pageCount: 1,
      mimeType: "application/pdf",
      storagePath: "gcs://vnexus-v2-documents/case-1/input.pdf"
    }
  ],
  pages: [
    {
      id: "page-1",
      sourceFileId: "doc-1",
      pageOrder: 1
    }
  ],
  blocks: [] as Array<{
    caseId: string;
    sourceFileId: string;
    sourcePageId: string;
    fileOrder: number;
    pageOrder: number;
    blockIndex: number;
    textRaw: string;
    textNormalized: string;
    bboxJson: { xMin: number; yMin: number; xMax: number; yMax: number } | null;
    confidence: number | null;
  }>,
  readCalls: [] as string[],
  ocrCalls: [] as string[],
  dateExtractionCalls: [] as Array<{ caseId: string; sourceFileId: string }>,
  entityExtractionCalls: [] as string[],
  windowBuildCalls: [] as string[],
  atomBuildCalls: [] as string[],
  bundleBuildCalls: [] as string[],
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
      findMany: vi.fn(async () => [...state.documents]),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: { pageCount: number } }) => {
        const target = state.documents.find((item) => item.id === where.id);
        if (!target) {
          throw new Error("document not found");
        }
        target.pageCount = data.pageCount;
        return target;
      })
    },
    case: {
      update: vi.fn(async () => ({ id: "case-1", status: "ready" }))
    },
    sourcePage: {
      findMany: vi.fn(async ({ where }: { where: { sourceFileId: string } }) =>
        state.pages
          .filter((item) => item.sourceFileId === where.sourceFileId)
          .sort((a, b) => a.pageOrder - b.pageOrder)
      ),
      createMany: vi.fn(async ({ data }: { data: Array<{ sourceFileId: string; pageOrder: number }> }) => {
        data.forEach((item, index) => {
          state.pages.push({
            id: `page-${state.pages.length + index + 1}`,
            sourceFileId: item.sourceFileId,
            pageOrder: item.pageOrder
          });
        });
      }),
      deleteMany: vi.fn(async ({ where }: { where: { id: { in: string[] } } }) => {
        state.pages = state.pages.filter((item) => !where.id.in.includes(item.id));
      })
    },
    ocrBlock: {
      deleteMany: vi.fn(async ({ where }: { where: { sourceFileId: string } }) => {
        state.blocks = state.blocks.filter((item) => item.sourceFileId !== where.sourceFileId);
      }),
      createMany: vi.fn(async ({ data }: { data: typeof state.blocks }) => {
        state.blocks.push(...data);
      })
    },
    $transaction: vi.fn(async <T>(callback: (tx: any) => Promise<T>) =>
      callback({
        sourcePage: {
          findMany: async ({ where }: { where: { sourceFileId: string } }) =>
            state.pages
              .filter((item) => item.sourceFileId === where.sourceFileId)
              .sort((a, b) => a.pageOrder - b.pageOrder),
          createMany: async ({ data }: { data: Array<{ sourceFileId: string; pageOrder: number }> }) => {
            data.forEach((item, index) => {
              state.pages.push({
                id: `page-${state.pages.length + index + 1}`,
                sourceFileId: item.sourceFileId,
                pageOrder: item.pageOrder
              });
            });
          },
          deleteMany: async ({ where }: { where: { id: { in: string[] } } }) => {
            state.pages = state.pages.filter((item) => !where.id.in.includes(item.id));
          }
        },
        ocrBlock: {
          deleteMany: async ({ where }: { where: { sourceFileId: string } }) => {
            state.blocks = state.blocks.filter((item) => item.sourceFileId !== where.sourceFileId);
          },
          createMany: async ({ data }: { data: typeof state.blocks }) => {
            state.blocks.push(...data);
          }
        },
        sourceDocument: {
          update: async ({ where, data }: { where: { id: string }; data: { pageCount: number } }) => {
            const target = state.documents.find((item) => item.id === where.id);
            if (!target) {
              throw new Error("document not found");
            }
            target.pageCount = data.pageCount;
            return target;
          }
        }
      })
    )
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
  callOcrProvider: vi.fn(async (base64: string, input?: { mimeType?: string; storagePath?: string }) => {
    if (state.shouldFailOcr) {
      throw new Error("ocr failed");
    }
    state.ocrCalls.push(`${base64}|${input?.mimeType ?? "unknown"}|${input?.storagePath ?? "unknown"}`);
    return [
      {
        text: " 진단서 ",
        bbox: { xMin: 1, yMin: 2, xMax: 3, yMax: 4 },
        confidence: 0.97,
        pageOrder: 1
      },
      {
        text: " 검사결과",
        bbox: { xMin: 5, yMin: 6, xMax: 7, yMax: 8 },
        confidence: 0.82,
        pageOrder: 1
      }
    ];
  })
}));

vi.mock("./date-extraction-service", () => ({
  extractAndPersistDateCandidatesForDocument: vi.fn(async (caseId: string, sourceFileId: string) => {
    state.dateExtractionCalls.push({ caseId, sourceFileId });
    return { sourceFileId, candidateCount: 1 };
  })
}));

vi.mock("./entity-extraction-service", () => ({
  extractAndPersistEntityCandidates: vi.fn(async (caseId: string) => {
    state.entityExtractionCalls.push(caseId);
    return { caseId, candidateCount: 1 };
  })
}));

vi.mock("./date-centered-window-service", () => ({
  buildAndPersistDateCenteredWindows: vi.fn(async (caseId: string) => {
    state.windowBuildCalls.push(caseId);
    return { caseId, windowCount: 1 };
  })
}));

vi.mock("./event-atom-service", () => ({
  buildAndPersistEventAtoms: vi.fn(async (caseId: string) => {
    state.atomBuildCalls.push(caseId);
    return { caseId, atomCount: 1 };
  })
}));

vi.mock("./event-bundle-service", () => ({
  buildAndPersistEventBundles: vi.fn(async (caseId: string) => {
    state.bundleBuildCalls.push(caseId);
    return { caseId, bundleCount: 1 };
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
      completedAt: null,
      finishedAt: null,
      errorMessage: null
    };
    state.documents = [
      {
        id: "doc-1",
        caseId: "case-1",
        fileOrder: 1,
        pageCount: 1,
        mimeType: "application/pdf",
        storagePath: "gcs://vnexus-v2-documents/case-1/input.pdf"
      }
    ];
    state.pages = [
      {
        id: "page-1",
        sourceFileId: "doc-1",
        pageOrder: 1
      }
    ];
    state.blocks = [];
    state.readCalls = [];
    state.ocrCalls = [];
    state.dateExtractionCalls = [];
    state.entityExtractionCalls = [];
    state.windowBuildCalls = [];
    state.atomBuildCalls = [];
    state.bundleBuildCalls = [];
    state.shouldFailOcr = false;
  });

  it("reads storagePath, calls OCR provider, and persists OCR blocks", async () => {
    const result = await runOcrIngestionSkeleton("job-1");

    expect(state.readCalls).toEqual(["gcs://vnexus-v2-documents/case-1/input.pdf"]);
    expect(state.ocrCalls).toEqual(["ZmFrZS1iYXNlNjQ=|application/pdf|gcs://vnexus-v2-documents/case-1/input.pdf"]);
    expect(state.blocks).toHaveLength(2);
    expect(state.blocks.map((block) => block.blockIndex)).toEqual([0, 1]);
    expect(state.blocks.map((block) => block.pageOrder)).toEqual([1, 1]);
    expect(state.blocks[0]?.textNormalized).toBe("진단서");
    expect(state.documents[0]?.pageCount).toBe(1);
    expect(state.dateExtractionCalls).toEqual([{ caseId: "case-1", sourceFileId: "doc-1" }]);
    expect(state.entityExtractionCalls).toEqual(["case-1"]);
    expect(state.windowBuildCalls).toEqual(["case-1"]);
    expect(state.atomBuildCalls).toEqual(["case-1"]);
    expect(state.bundleBuildCalls).toEqual(["case-1"]);
    expect(result.status).toBe("completed");
    expect(state.job.completedAt).toBeInstanceOf(Date);
  });

  it("marks job as failed when OCR provider throws", async () => {
    state.shouldFailOcr = true;

    await expect(runOcrIngestionSkeleton("job-1")).rejects.toThrow("ocr failed");
    expect(state.job.status).toBe("failed");
    expect(state.job.completedAt).toBeNull();
  });
});
