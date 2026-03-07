import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentCreateInput, UserRole } from "@vnexus/shared";

const state = vi.hoisted(() => ({
  documents: [] as Array<{
    id: string;
    caseId: string;
    originalFileName: string;
    fileOrder: number;
    pageCount: number;
    mimeType: string;
    storagePath: string;
  }>,
  pages: [] as Array<{
    id: string;
    sourceFileId: string;
    pageOrder: number;
  }>,
  evidences: [] as Array<{
    id: string;
    caseId: string;
    sourceFileId: string;
    sourcePageId: string;
    fileOrder: number;
    pageOrder: number;
    evidenceKind: "ocr_block" | "merged_window" | "page_region";
    blockIndexStart: number | null;
    blockIndexEnd: number | null;
    bboxJson: null;
    quote: string;
    contextBefore: string | null;
    contextAfter: string | null;
    confidence: number | null;
    createdAt: Date;
  }>
}));

vi.mock("../../prisma", () => {
  const prisma = {
    sourceDocument: {
      findMany: vi.fn(async ({ where, orderBy }: { where?: { caseId?: string }; orderBy?: { fileOrder?: "asc" } }) => {
        const filtered = where?.caseId
          ? state.documents.filter((item) => item.caseId === where.caseId)
          : [...state.documents];

        if (orderBy?.fileOrder === "asc") {
          filtered.sort((a, b) => a.fileOrder - b.fileOrder);
        }

        return filtered;
      }),
      findFirst: vi.fn(async ({ where }: { where: { id: string; case?: { ownerUserId: string } } }) => {
        const documentId = where.id;
        return state.documents.find((item) => item.id === documentId) ?? null;
      })
    },
    sourcePage: {
      findMany: vi.fn(async ({ where, orderBy }: { where?: { sourceFileId?: string }; orderBy?: { pageOrder?: "asc" } }) => {
        const filtered = where?.sourceFileId
          ? state.pages.filter((item) => item.sourceFileId === where.sourceFileId)
          : [...state.pages];

        if (orderBy?.pageOrder === "asc") {
          filtered.sort((a, b) => a.pageOrder - b.pageOrder);
        }

        return filtered;
      })
    },
    evidenceRef: {
      findMany: vi.fn(async () =>
        [...state.evidences].sort((a, b) => {
          if (a.fileOrder !== b.fileOrder) return a.fileOrder - b.fileOrder;
          if (a.pageOrder !== b.pageOrder) return a.pageOrder - b.pageOrder;
          return (a.blockIndexStart ?? 0) - (b.blockIndexStart ?? 0);
        })
      )
    },
    case: {
      findFirst: vi.fn(async () => ({ id: "case-1" }))
    },
    $transaction: vi.fn(async <T>(callback: (tx: any) => Promise<T>) =>
      callback({
        sourceDocument: {
          create: vi.fn(async ({ data }: { data: DocumentCreateInput & { caseId: string; fileOrder: number; storagePath: string } }) => {
            const created = { ...data, id: `doc-${state.documents.length + 1}` };
            state.documents.push(created);
            return created;
          }),
          findMany: vi.fn(async ({ where }: { where: { caseId: string } }) =>
            [...state.documents]
              .filter((item) => item.caseId === where.caseId)
              .sort((a, b) => a.fileOrder - b.fileOrder)
          ),
          delete: vi.fn(async ({ where }: { where: { id: string } }) => {
            state.documents = state.documents.filter((item) => item.id !== where.id);
          }),
          update: vi.fn(async ({ where, data }: { where: { id: string }; data: { fileOrder: number } }) => {
            const target = state.documents.find((item) => item.id === where.id);
            if (target) target.fileOrder = data.fileOrder;
            return target;
          })
        },
        sourcePage: {
          createMany: vi.fn(async ({ data }: { data: Array<{ sourceFileId: string; pageOrder: number }> }) => {
            data.forEach((item, index) => {
              state.pages.push({
                id: `page-${state.pages.length + index + 1}`,
                sourceFileId: item.sourceFileId,
                pageOrder: item.pageOrder
              });
            });
          })
        }
      })
    )
  };

  return { prisma };
});

vi.mock("./case-service", () => ({
  getCaseForUser: vi.fn(async () => ({ id: "case-1" }))
}));

import { createDocument, listDocuments } from "./document-service";
import { listEvidenceForCase } from "./evidence-service";

describe("Epic 1 ingestion ordering", () => {
  beforeEach(() => {
    state.documents = [];
    state.pages = [];
    state.evidences = [];
  });

  it("increments fileOrder without gaps on document creation", async () => {
    await createDocument("case-1", "user-1", "consumer" as UserRole, {
      originalFileName: "a.pdf",
      mimeType: "application/pdf",
      pageCount: 2
    });
    const second = await createDocument("case-1", "user-1", "consumer" as UserRole, {
      originalFileName: "b.pdf",
      mimeType: "application/pdf",
      pageCount: 1
    });

    expect(second.fileOrder).toBe(2);
  });

  it("creates pageOrder as 1..N", async () => {
    const document = await createDocument("case-1", "user-1", "consumer" as UserRole, {
      originalFileName: "a.pdf",
      mimeType: "application/pdf",
      pageCount: 3
    });

    const pages = state.pages.filter((item) => item.sourceFileId === document.id).map((item) => item.pageOrder);
    expect(pages).toEqual([1, 2, 3]);
  });

  it("returns document list sorted by fileOrder", async () => {
    state.documents.push(
      {
        id: "doc-2",
        caseId: "case-1",
        originalFileName: "b.pdf",
        fileOrder: 2,
        pageCount: 1,
        mimeType: "application/pdf",
        storagePath: "b"
      },
      {
        id: "doc-1",
        caseId: "case-1",
        originalFileName: "a.pdf",
        fileOrder: 1,
        pageCount: 1,
        mimeType: "application/pdf",
        storagePath: "a"
      }
    );

    const items = await listDocuments("case-1", "user-1", "consumer" as UserRole);
    expect(items.map((item) => item.fileOrder)).toEqual([1, 2]);
  });

  it("returns evidence list sorted by fileOrder/pageOrder/blockIndexStart", async () => {
    state.evidences.push(
      {
        id: "ev-2",
        caseId: "case-1",
        sourceFileId: "doc-1",
        sourcePageId: "page-1",
        fileOrder: 1,
        pageOrder: 2,
        evidenceKind: "ocr_block",
        blockIndexStart: 4,
        blockIndexEnd: 4,
        bboxJson: null,
        quote: "B",
        contextBefore: null,
        contextAfter: null,
        confidence: 0.8,
        createdAt: new Date("2026-03-08T00:00:00Z")
      },
      {
        id: "ev-1",
        caseId: "case-1",
        sourceFileId: "doc-1",
        sourcePageId: "page-1",
        fileOrder: 1,
        pageOrder: 1,
        evidenceKind: "ocr_block",
        blockIndexStart: 1,
        blockIndexEnd: 1,
        bboxJson: null,
        quote: "A",
        contextBefore: null,
        contextAfter: null,
        confidence: 0.9,
        createdAt: new Date("2026-03-08T00:00:00Z")
      }
    );

    const result = await listEvidenceForCase("case-1", "user-1", "consumer" as UserRole);
    expect(result.items.map((item) => item.evidenceId)).toEqual(["ev-1", "ev-2"]);
  });
});
