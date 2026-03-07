import { ApiError } from "@vnexus/shared";

type OrderedDocument = {
  id?: string;
  fileOrder: number;
};

type OrderedPage = {
  id?: string;
  sourceFileId: string;
  pageOrder: number;
};

type OrderedOcrBlock = {
  sourceFileId: string;
  sourcePageId: string;
  fileOrder: number;
  pageOrder: number;
  blockIndex: number;
};

export function assertContiguousFileOrders(documents: OrderedDocument[]) {
  const sorted = [...documents].sort((a, b) => a.fileOrder - b.fileOrder);

  sorted.forEach((document, index) => {
    const expected = index + 1;
    if (document.fileOrder !== expected) {
      throw new ApiError("CONFLICT", "fileOrder must remain contiguous and gap-free", {
        expected,
        actual: document.fileOrder,
        documentId: document.id
      });
    }
  });
}

export function assertContiguousPageOrders(pages: OrderedPage[]) {
  const pagesByFile = new Map<string, OrderedPage[]>();

  for (const page of pages) {
    const bucket = pagesByFile.get(page.sourceFileId) ?? [];
    bucket.push(page);
    pagesByFile.set(page.sourceFileId, bucket);
  }

  for (const [sourceFileId, group] of pagesByFile.entries()) {
    const sorted = [...group].sort((a, b) => a.pageOrder - b.pageOrder);
    sorted.forEach((page, index) => {
      const expected = index + 1;
      if (page.pageOrder !== expected) {
        throw new ApiError("CONFLICT", "pageOrder must remain contiguous per source document", {
          sourceFileId,
          expected,
          actual: page.pageOrder,
          pageId: page.id
        });
      }
    });
  }
}

export function assertOcrBlockOrderInvariant(
  blocks: OrderedOcrBlock[],
  pages: Map<string, { sourceFileId: string; pageOrder: number }>,
  documents: Map<string, { fileOrder: number }>
) {
  for (const block of blocks) {
    const page = pages.get(block.sourcePageId);
    const document = documents.get(block.sourceFileId);

    if (!page || !document) {
      throw new ApiError("CONFLICT", "OCR block references unknown page or document", {
        sourceFileId: block.sourceFileId,
        sourcePageId: block.sourcePageId
      });
    }

    if (document.fileOrder !== block.fileOrder || page.pageOrder !== block.pageOrder) {
      throw new ApiError("CONFLICT", "OCR block fileOrder/pageOrder must preserve source ordering", {
        sourceFileId: block.sourceFileId,
        sourcePageId: block.sourcePageId,
        expectedFileOrder: document.fileOrder,
        actualFileOrder: block.fileOrder,
        expectedPageOrder: page.pageOrder,
        actualPageOrder: block.pageOrder,
        blockIndex: block.blockIndex
      });
    }
  }
}
