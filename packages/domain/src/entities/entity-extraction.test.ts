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

  it("extracts hospital, department, diagnosis, test, treatment, procedure, surgery, admission, discharge, pathology, medication", () => {
    const result = extractEntityCandidates({
      ocrBlocks: [
        {
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 1,
          textRaw: "서울대학교병원 정형외과"
        },
        {
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 2,
          textRaw: "주상병 S06.0 진단, CT 검사"
        },
        {
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 3,
          textRaw: "치료 및 처치 후 시술, 수술"
        },
        {
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 4,
          textRaw: "입원 후 퇴원, 병리 검체 슬라이드"
        },
        {
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 5,
          textRaw: "약물 복용 및 처방"
        }
      ],
      dateCandidates
    });

    expect(result.some((item) => item.candidateType === "hospital")).toBe(true);
    expect(result.some((item) => item.candidateType === "department")).toBe(true);
    expect(result.some((item) => item.candidateType === "diagnosis")).toBe(true);
    expect(result.some((item) => item.candidateType === "test")).toBe(true);
    expect(result.some((item) => item.candidateType === "treatment")).toBe(true);
    expect(result.some((item) => item.candidateType === "procedure")).toBe(true);
    expect(result.some((item) => item.candidateType === "surgery")).toBe(true);
    expect(result.some((item) => item.candidateType === "admission")).toBe(true);
    expect(result.some((item) => item.candidateType === "discharge")).toBe(true);
    expect(result.some((item) => item.candidateType === "pathology")).toBe(true);
    expect(result.some((item) => item.candidateType === "medication")).toBe(true);
  });

  it("normalizes text and separates admin from unknown", () => {
    const result = extractEntityCandidates({
      ocrBlocks: [
        {
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 6,
          textRaw: "  보험   접수  "
        },
        {
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 7,
          textRaw: "기타 참고"
        }
      ],
      dateCandidates
    });

    const admin = result.find((item) => item.candidateType === "admin");
    const unknown = result.find((item) => item.candidateType === "unknown");

    expect(admin?.normalizedText).toBe("보험 접수");
    expect(unknown?.normalizedText).toBe("기타 참고");
  });
});
