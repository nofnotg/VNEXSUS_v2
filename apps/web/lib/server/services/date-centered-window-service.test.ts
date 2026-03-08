import { beforeEach, describe, expect, it, vi } from "vitest";

type PersistedDateCenteredWindow = {
  id: string;
  caseId: string;
  dateCandidateId: string;
  sourceFileId: string;
  sourcePageId: string;
  canonicalDate: string;
  fileOrder: number;
  pageOrder: number;
  anchorBlockIndex: number;
  windowStartBlockIndex: number;
  windowEndBlockIndex: number;
  candidateSummaryJson: {
    hospitals: string[];
    departments: string[];
    diagnoses: string[];
    tests: string[];
    treatments: string[];
    procedures: string[];
    surgeries: string[];
    admissions: string[];
    discharges: string[];
    pathologies: string[];
    medications: string[];
    symptoms: string[];
  };
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
      blockIndex: 0
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
      blockIndex: 2,
      rawDateText: "2024.03.07",
      normalizedDate: "2024-03-07",
      dateTypeCandidate: "visit" as const,
      confidence: 0.9,
      createdAt: new Date("2026-03-08T00:00:00.000Z")
    },
    {
      id: "date-admin",
      caseId: "case-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      fileOrder: 1,
      pageOrder: 1,
      blockIndex: 5,
      rawDateText: "2024.03.08",
      normalizedDate: "2024-03-08",
      dateTypeCandidate: "admin" as const,
      confidence: 0.5,
      createdAt: new Date("2026-03-08T00:00:01.000Z")
    }
  ],
  entityCandidates: [
    {
      id: "entity-1",
      caseId: "case-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      relatedDateCandidateId: "date-1",
      fileOrder: 1,
      pageOrder: 1,
      blockIndex: 1,
      candidateType: "hospital" as const,
      rawText: "서울병원",
      normalizedText: "서울병원",
      confidence: 0.88,
      metadataJson: null,
      createdAt: new Date("2026-03-08T00:00:00.000Z")
    },
    {
      id: "entity-2",
      caseId: "case-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      relatedDateCandidateId: "date-1",
      fileOrder: 1,
      pageOrder: 1,
      blockIndex: 3,
      candidateType: "test" as const,
      rawText: "CT",
      normalizedText: "CT",
      confidence: 0.8,
      metadataJson: null,
      createdAt: new Date("2026-03-08T00:00:01.000Z")
    }
  ],
  windows: [
    {
      id: "stale-window",
      caseId: "case-1",
      dateCandidateId: "old-date",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      canonicalDate: "2020-01-01",
      fileOrder: 9,
      pageOrder: 9,
      anchorBlockIndex: 9,
      windowStartBlockIndex: 7,
      windowEndBlockIndex: 11,
      candidateSummaryJson: {
        hospitals: [],
        departments: [],
        diagnoses: [],
        tests: [],
        treatments: [],
        procedures: [],
        surgeries: [],
        admissions: [],
        discharges: [],
        pathologies: [],
        medications: [],
        symptoms: []
      },
      createdAt: new Date("2026-03-08T00:00:09.000Z")
    }
  ] as PersistedDateCenteredWindow[]
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
      findMany: vi.fn(async () => [...state.entityCandidates])
    },
    dateCenteredWindow: {
      findMany: vi.fn(async () =>
        [...state.windows].sort((a, b) => {
          if (a.fileOrder !== b.fileOrder) return a.fileOrder - b.fileOrder;
          if (a.pageOrder !== b.pageOrder) return a.pageOrder - b.pageOrder;
          if (a.anchorBlockIndex !== b.anchorBlockIndex) return a.anchorBlockIndex - b.anchorBlockIndex;
          return a.createdAt.getTime() - b.createdAt.getTime();
        })
      )
    },
    $transaction: vi.fn(async <T>(callback: (tx: any) => Promise<T>) =>
      callback({
        dateCenteredWindow: {
          deleteMany: async ({ where }: { where: { caseId: string } }) => {
            state.windows = state.windows.filter((item) => item.caseId !== where.caseId);
          },
          createMany: async ({
            data
          }: {
            data: Array<Omit<PersistedDateCenteredWindow, "id" | "createdAt">>;
          }) => {
            data.forEach((item, index) => {
              state.windows.push({
                id: `window-${state.windows.length + index + 1}`,
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

import { buildAndPersistDateCenteredWindows, listDateCenteredWindows } from "./date-centered-window-service";

describe("date-centered window service", () => {
  beforeEach(() => {
    state.windows = [
      {
        id: "stale-window",
        caseId: "case-1",
        dateCandidateId: "old-date",
        sourceFileId: "doc-1",
        sourcePageId: "page-1",
        canonicalDate: "2020-01-01",
        fileOrder: 9,
        pageOrder: 9,
        anchorBlockIndex: 9,
        windowStartBlockIndex: 7,
        windowEndBlockIndex: 11,
        candidateSummaryJson: {
          hospitals: [],
          departments: [],
          diagnoses: [],
          tests: [],
          treatments: [],
          procedures: [],
          surgeries: [],
          admissions: [],
          discharges: [],
          pathologies: [],
          medications: [],
          symptoms: []
        },
        createdAt: new Date("2026-03-08T00:00:09.000Z")
      }
    ];
  });

  it("stores date-centered windows from DateCandidates and EntityCandidates", async () => {
    const result = await buildAndPersistDateCenteredWindows("case-1");

    expect(result.windowCount).toBe(1);
    expect(state.windows).toHaveLength(1);
    expect(state.windows[0]?.candidateSummaryJson.hospitals).toEqual(["서울병원"]);
    expect(state.windows[0]?.candidateSummaryJson.tests).toEqual(["CT"]);
  });

  it("recreates windows in order with response contract shape", async () => {
    await buildAndPersistDateCenteredWindows("case-1");

    const result = await listDateCenteredWindows("case-1", "user-1", "consumer");

    expect(result.every((item: (typeof result)[number]) => item.canonicalDate !== "2020-01-01")).toBe(true);
    expect(result[0]?.anchorBlockIndex).toBe(2);
    expect(result[0]?.candidateSummaryJson.hospitals).toEqual(["서울병원"]);
    expect(result[0]?.createdAt).toBe("2026-03-08T00:00:00.000Z");
  });
});
