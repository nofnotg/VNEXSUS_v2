import { beforeEach, describe, expect, it, vi } from "vitest";

type PersistedEntityCandidate = {
  id: string;
  caseId: string;
  sourceFileId: string;
  sourcePageId: string;
  relatedDateCandidateId: string | null;
  fileOrder: number;
  pageOrder: number;
  blockIndex: number;
  candidateType:
    | "hospital"
    | "department"
    | "diagnosis"
    | "test"
    | "treatment"
    | "procedure"
    | "surgery"
    | "admission"
    | "discharge"
    | "pathology"
    | "medication"
    | "symptom"
    | "admin"
    | "unknown";
  rawText: string;
  normalizedText: string;
  confidence: number;
  metadataJson: Record<string, unknown> | null;
  createdAt: Date;
};

const state = vi.hoisted(() => ({
  ocrBlocks: [
    {
      id: "block-1",
      caseId: "case-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      fileOrder: 1,
      pageOrder: 1,
      blockIndex: 0,
      textRaw: "서울병원 내과",
      textNormalized: "서울병원 내과"
    },
    {
      id: "block-2",
      caseId: "case-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      fileOrder: 1,
      pageOrder: 1,
      blockIndex: 2,
      textRaw: "주상병 S06.0, CT 검사 및 약물 처방",
      textNormalized: "주상병 S06.0, CT 검사 및 약물 처방"
    }
  ],
  dateCandidates: [
    {
      id: "date-1",
      caseId: "case-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      fileOrder: 1,
      pageOrder: 1,
      blockIndex: 1
    }
  ],
  entityCandidates: [
    {
      id: "stale-1",
      caseId: "case-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      relatedDateCandidateId: null,
      fileOrder: 9,
      pageOrder: 9,
      blockIndex: 9,
      candidateType: "unknown" as const,
      rawText: "stale",
      normalizedText: "stale",
      confidence: 0.1,
      metadataJson: null,
      createdAt: new Date("2026-03-08T00:00:09.000Z")
    }
  ] as PersistedEntityCandidate[]
}));

vi.mock("../../prisma", () => ({
  prisma: {
    ocrBlock: {
      findMany: vi.fn(async () => [...state.ocrBlocks])
    },
    dateCandidate: {
      findMany: vi.fn(async () => [...state.dateCandidates])
    },
    entityCandidate: {
      findMany: vi.fn(async () =>
        [...state.entityCandidates].sort((a, b) => {
          if (a.fileOrder !== b.fileOrder) return a.fileOrder - b.fileOrder;
          if (a.pageOrder !== b.pageOrder) return a.pageOrder - b.pageOrder;
          if (a.blockIndex !== b.blockIndex) return a.blockIndex - b.blockIndex;
          return a.createdAt.getTime() - b.createdAt.getTime();
        })
      )
    },
    $transaction: vi.fn(async <T>(callback: (tx: any) => Promise<T>) =>
      callback({
        entityCandidate: {
          deleteMany: async ({ where }: { where: { caseId: string } }) => {
            state.entityCandidates = state.entityCandidates.filter((item) => item.caseId !== where.caseId);
          },
          createMany: async ({
            data
          }: {
            data: Array<{
              caseId: string;
              sourceFileId: string;
              sourcePageId: string;
              relatedDateCandidateId: string | null;
              fileOrder: number;
              pageOrder: number;
              blockIndex: number;
              candidateType: PersistedEntityCandidate["candidateType"];
              rawText: string;
              normalizedText: string;
              confidence: number;
                metadataJson: Record<string, unknown> | null;
            }>;
          }) => {
            data.forEach((item, index) => {
              state.entityCandidates.push({
                id: `entity-${state.entityCandidates.length + index + 1}`,
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

import { extractAndPersistEntityCandidates, listEntityCandidates } from "./entity-extraction-service";

describe("entity extraction service", () => {
  beforeEach(() => {
    state.entityCandidates = [
      {
        id: "stale-1",
        caseId: "case-1",
        sourceFileId: "doc-1",
        sourcePageId: "page-1",
        relatedDateCandidateId: null,
        fileOrder: 9,
        pageOrder: 9,
        blockIndex: 9,
        candidateType: "unknown",
        rawText: "stale",
        normalizedText: "stale",
        confidence: 0.1,
        metadataJson: null,
        createdAt: new Date("2026-03-08T00:00:09.000Z")
      }
    ];
  });

  it("stores EntityCandidates from OCR blocks and DateCandidates", async () => {
    const result = await extractAndPersistEntityCandidates("case-1");

    expect(result.candidateCount).toBeGreaterThan(0);
    expect(state.entityCandidates.some((item) => item.candidateType === "hospital")).toBe(true);
    expect(state.entityCandidates.some((item) => item.candidateType === "department")).toBe(true);
    expect(state.entityCandidates.some((item) => item.candidateType === "diagnosis")).toBe(true);
    expect(state.entityCandidates.some((item) => item.candidateType === "test")).toBe(true);
    expect(state.entityCandidates.some((item) => item.candidateType === "medication")).toBe(true);
  });

  it("recreates candidates in order and links nearby DateCandidates", async () => {
    await extractAndPersistEntityCandidates("case-1");

    const result = await listEntityCandidates("case-1", "user-1", "consumer");

    expect(result.every((item) => item.rawText !== "stale")).toBe(true);
    expect(result.map((item) => item.blockIndex)).toEqual([...result.map((item) => item.blockIndex)].sort((a, b) => a - b));
    expect(result.some((item) => item.relatedDateCandidateId === "date-1")).toBe(true);
    expect(result[0]?.createdAt).toBe("2026-03-08T00:00:00.000Z");
  });
});
