import { describe, expect, it } from "vitest";
import {
  assertContiguousFileOrders,
  assertContiguousPageOrders,
  assertOcrBlockOrderInvariant
} from "./invariants";

describe("document and OCR ordering invariants", () => {
  it("accepts contiguous fileOrder values", () => {
    expect(() =>
      assertContiguousFileOrders([{ fileOrder: 1 }, { fileOrder: 2 }, { fileOrder: 3 }])
    ).not.toThrow();
  });

  it("rejects fileOrder gaps", () => {
    expect(() => assertContiguousFileOrders([{ fileOrder: 1 }, { fileOrder: 3 }])).toThrow();
  });

  it("accepts contiguous pageOrder values per file", () => {
    expect(() =>
      assertContiguousPageOrders([
        { sourceFileId: "doc-1", pageOrder: 1 },
        { sourceFileId: "doc-1", pageOrder: 2 }
      ])
    ).not.toThrow();
  });

  it("rejects OCR block order drift", () => {
    expect(() =>
      assertOcrBlockOrderInvariant(
        [
          {
            sourceFileId: "doc-1",
            sourcePageId: "page-1",
            fileOrder: 2,
            pageOrder: 1,
            blockIndex: 10
          }
        ],
        new Map([["page-1", { sourceFileId: "doc-1", pageOrder: 1 }]]),
        new Map([["doc-1", { fileOrder: 1 }]])
      )
    ).toThrow();
  });
});
