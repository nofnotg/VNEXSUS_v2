import { describe, expect, it } from "vitest";
import { extractEntityCandidates } from "./entity-extraction";

describe("EntityCandidate extraction", () => {
  const dateCandidates = [
    {
      id: "date-1",
      caseId: "case-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      fileOrder: 1,
      pageOrder: 1,
      blockIndex: 2
    }
  ];

  it("canonicalizes hospital aliases and collects core medical entities", () => {
    const result = extractEntityCandidates({
      ocrBlocks: [
        {
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 1,
          textRaw: "SM \uC601\uC0C1\uC758\uD559\uACFC \uC758\uC6D0 \uC601\uC0C1\uC758\uD559\uACFC"
        },
        {
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 2,
          textRaw: "\uC8FC\uC0C1\uBCD1 S06.0 \uC9C4\uB2E8, CT \uAC80\uC0AC"
        },
        {
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 3,
          textRaw: "\uCE58\uB8CC \uBC0F \uCC98\uCE58, \uC2DC\uC220"
        }
      ],
      dateCandidates
    });

    const hospital = result.find((item) => item.candidateType === "hospital");

    expect(hospital?.normalizedText).toBe("\uC5D0\uC2A4\uC5E0\uC601\uC0C1\uC758\uD559\uACFC\uC758\uC6D0");
    expect(result.some((item) => item.candidateType === "department")).toBe(true);
    expect(result.some((item) => item.candidateType === "diagnosis")).toBe(true);
    expect(result.some((item) => item.candidateType === "test")).toBe(true);
    expect(result.some((item) => item.candidateType === "treatment")).toBe(true);
    expect(result.some((item) => item.candidateType === "procedure")).toBe(true);
  });

  it("ignores department-only center labels as hospitals", () => {
    const result = extractEntityCandidates({
      ocrBlocks: [
        {
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 5,
          textRaw: "\uC554\uC13C\uD130 \uC9C4\uB8CC"
        }
      ],
      dateCandidates
    });

    expect(result.some((item) => item.candidateType === "hospital")).toBe(false);
  });
});
