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

  it("extracts normalized ISO dates from clinical OCR text", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "\uC9C4\uB8CC\uC77C 2024.3.7 / \uCD08\uC74C\uD30C 2024\uB144 3\uC6D4 8\uC77C"
    });

    expect(result.map((item) => item.normalizedDate)).toEqual(["2024-03-07", "2024-03-08"]);
  });

  it("filters invalid or implausible dates", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "\uCC28\uD2B8 2925-05-19 / \uC2E4\uC81C \uC9C4\uB8CC\uC77C 2024/03/09"
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.normalizedDate).toBe("2024-03-09");
  });

  it("drops birth-like dates from candidate output", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "\uC0DD\uB144\uC6D4\uC77C 1982.04.03 / \uCC28\uD2B8 \uBC88\uD638"
    });

    expect(result).toHaveLength(0);
  });

  it("keeps clinically anchored dates even when the same block contains a birth date", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "\uC0DD\uB144\uC6D4\uC77C 1982.04.03 / \uC9C4\uB8CC\uC77C 2024.03.10 MRI \uC2DC\uD589"
    });

    expect(result.map((item) => item.normalizedDate)).toEqual(["2024-03-10"]);
    expect(result[0]?.dateTypeCandidate).toBe("exam");
  });

  it("marks reservation dates as plan", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "\uC608\uC57D \uC77C\uC790 24-03-11"
    });

    expect(result[0]?.normalizedDate).toBe("2024-03-11");
    expect(result[0]?.dateTypeCandidate).toBe("plan");
  });

  it("filters metadata-style dates without clinical anchors", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "\uBC1C\uAE09\uC77C 2024-03-11 / page 3 / \uC778\uC1C4"
    });

    expect(result).toHaveLength(0);
  });
});
