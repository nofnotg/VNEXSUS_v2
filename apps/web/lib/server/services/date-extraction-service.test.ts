import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  document: {
    id: "doc-1",
    caseId: "case-1"
  },
  blocks: [
    {
      id: "block-1",
      caseId: "case-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      fileOrder: 1,
      pageOrder: 1,
      blockIndex: 0,
      textRaw: "진료일 2024.3.7",
      textNormalized: "진료일 2024.3.7",
      bboxJson: null,
      confidence: 0.98,
      createdAt: new Date("2026-03-08T00:00:00.000Z")
    },
    {
      id: "block-2",
      caseId: "case-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      fileOrder: 1,
      pageOrder: 1,
      blockIndex: 1,
      textRaw: "서류 발급일 2024/03/08",
      textNormalized: "서류 발급일 2024/03/08",
      bboxJson: null,
      confidence: 0.87,
      createdAt: new Date("2026-03-08T00:00:01.000Z")
    }
  ],
  dateCandidates: [] as Array<{
    id: string;
    caseId: string;
    sourceFileId: string;
    sourcePageId: string;
    fileOrder: number;
    pageOrder: number;
    blockIndex: number;
    rawDateText: string;
    normalizedDate: string | null;
    dateTypeCandidate:
      | "visit"
      | "exam"
      | "report"
      | "pathology"
      | "surgery"
      | "admission"
      | "discharge"
      | "plan"
      | "admin"
      | "irrelevant";
    confidence: number;
    createdAt: Date;
  }>
}));

vi.mock("../../prisma", () => ({
  prisma: {
    sourceDocument: {
      findFirst: vi.fn(async () => state.document)
    },
    ocrBlock: {
      findMany: vi.fn(async () => [...state.blocks])
    },
    dateCandidate: {
      findMany: vi.fn(async () =>
        [...state.dateCandidates].sort((a, b) => {
          if (a.fileOrder !== b.fileOrder) return a.fileOrder - b.fileOrder;
          if (a.pageOrder !== b.pageOrder) return a.pageOrder - b.pageOrder;
          if (a.blockIndex !== b.blockIndex) return a.blockIndex - b.blockIndex;
          return a.createdAt.getTime() - b.createdAt.getTime();
        })
      )
    },
    $transaction: vi.fn(async <T>(callback: (tx: any) => Promise<T>) =>
      callback({
        dateCandidate: {
          deleteMany: async ({ where }: { where: { caseId: string; sourceFileId: string } }) => {
            state.dateCandidates = state.dateCandidates.filter(
              (item) => item.caseId !== where.caseId || item.sourceFileId !== where.sourceFileId
            );
          },
          createMany: async ({
            data
          }: {
            data: Array<Omit<(typeof state.dateCandidates)[number], "id" | "createdAt">>;
          }) => {
            data.forEach((item, index) => {
              state.dateCandidates.push({
                id: `candidate-${state.dateCandidates.length + index + 1}`,
                ...item,
                createdAt: new Date(`2026-03-08T00:00:0${index}.000Z`)
              });
            });
          }
        }
      })
    )
  }
}));

vi.mock("./case-service", () => ({
  getCaseForUser: vi.fn(async () => ({ id: "case-1" }))
}));

import { extractAndPersistDateCandidatesForDocument, listDateCandidates } from "./date-extraction-service";

describe("date extraction service", () => {
  beforeEach(() => {
    state.dateCandidates = [];
  });

  it("extracts and stores DateCandidates from OCR blocks", async () => {
    const result = await extractAndPersistDateCandidatesForDocument("case-1", "doc-1");

    expect(result.candidateCount).toBe(2);
    expect(state.dateCandidates.map((item) => item.normalizedDate)).toEqual(["2024-03-07", "2024-03-08"]);
    expect(state.dateCandidates.map((item) => item.dateTypeCandidate)).toEqual(["visit", "admin"]);
  });

  it("returns DateCandidates sorted by fileOrder/pageOrder/blockIndex with createdAt", async () => {
    await extractAndPersistDateCandidatesForDocument("case-1", "doc-1");

    const result = await listDateCandidates("case-1", "user-1", "consumer");

    expect(result.map((item) => item.blockIndex)).toEqual([0, 1]);
    expect(result[0]?.createdAt).toBe("2026-03-08T00:00:00.000Z");
    expect(result[1]?.dateTypeCandidate).toBe("admin");
  });
});
