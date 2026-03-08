import { describe, expect, it } from "vitest";
import { extractDateCandidatesFromBlock } from "./date-extraction";

describe("DateCandidate extraction", () => {
  const baseInput = {
    caseId: "case-1",
    sourceFileId: "doc-1",
    sourcePageId: "page-1",
    fileOrder: 1,
    pageOrder: 1,
    blockIndex: 0
  };

  it("extracts normalized ISO dates from OCR text", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "진료일: 2024.3.7 / 재진일 2024년 3월 8일"
    });

    expect(result.map((item) => item.normalizedDate)).toEqual(["2024-03-07", "2024-03-08"]);
  });

  it("filters invalid dates by dropping them", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "오인식 2024-13-40 / 실제 2024/03/09"
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.normalizedDate).toBe("2024-03-09");
  });

  it("marks issuance or admin-like dates as admin", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "서류 발급일 2024.03.10"
    });

    expect(result[0]?.dateTypeCandidate).toBe("admin");
  });

  it("marks reservation dates as plan", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "예약일자 24-03-11"
    });

    expect(result[0]?.normalizedDate).toBe("2024-03-11");
    expect(result[0]?.dateTypeCandidate).toBe("plan");
  });
});
