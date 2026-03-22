import { describe, expect, it } from "vitest";
import { extractDateCandidatesFromBlock, extractDateCandidatesFromDocument } from "./date-extraction";

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

    expect(result).toHaveLength(0);
  });

  it("filters metadata-style dates without clinical anchors", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "\uBC1C\uAE09\uC77C 2024-03-11 / page 3 / \uC778\uC1C4"
    });

    expect(result).toHaveLength(0);
  });

  it("extracts compact yyyyMMdd dates when clinical labels are present", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "\uC9C4\uB8CC\uC77C\uC790:20241023 \uC9C4\uB8CC\uACFC : \uC18C\uC544\uCCAD\uC18C\uB144\uACFC"
    });

    expect(result.map((item) => item.normalizedDate)).toContain("2024-10-23");
  });

  it("filters compact identifier-like dates in administrative strings", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "\uCC98\uBC29\uC804\uAD50\uBD80\uBC88\uD638 20230117-00008"
    });

    expect(result).toHaveLength(0);
  });

  it("keeps clinical period boundary dates when the range is medically labeled", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "\uC9C4\uB8CC\uAE30\uAC04: 2024/10/22~2024/12/20 [\uC785\uC6D0]"
    });

    expect(result.map((item) => item.normalizedDate)).toEqual(["2024-10-22", "2024-12-20"]);
  });

  it("filters read-timestamp style dates when only pid metadata is present", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "[PID: 2511081 / Date: 2024-10-23] Unconfirmed Diagnosis"
    });

    expect(result).toHaveLength(0);
  });

  it("filters outpatient schedule log dates in high-pressure clinic time tables", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "[ 2025-05-28 ] 공단 . 재진 . 11 : 37/11 : 39.1 정형 외과 Dr. 이희두"
    });

    expect(result).toHaveLength(0);
  });

  it("filters outpatient authored-header dates that can otherwise inflate Case36 bundle pressure", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw:
        "\uC678\uB798 \uCD08\uC9C4 \uC791\uC131 \uACFC : \uD638\uD761\uAE30 \uB0B4\uACFC \uBD84\uACFC ( 2025-08-06 )"
    });

    expect(result).toHaveLength(0);
  });

  it("keeps parenthesized surgery dates when a stronger clinical label is present", () => {
    const result = extractDateCandidatesFromBlock({
      ...baseInput,
      textRaw: "\uC218\uC220\uC77C (2025-08-06) \uD76C\uB9DD \uC808\uC81C\uC220 \uC2DC\uD589"
    });

    expect(result.map((item) => item.normalizedDate)).toEqual(["2025-08-06"]);
    expect(result[0]?.dateTypeCandidate).toBe("surgery");
  });

  it("keeps the earliest repetitive inpatient diagnostic log seed while pruning later repeats", () => {
    const result = extractDateCandidatesFromDocument([
      { ...baseInput, blockIndex: 7, textRaw: "진료 기간 : 2024 / 10 / 22 ~ 2024 / 12 / 20" },
      { ...baseInput, blockIndex: 8, textRaw: "주치의 : 윤정하" },
      { ...baseInput, blockIndex: 9, textRaw: "병실 : NICU" },
      { ...baseInput, blockIndex: 10, textRaw: "[ 입원 ]" },
      { ...baseInput, blockIndex: 11, textRaw: "진료 일자 : 20241023" },
      { ...baseInput, blockIndex: 12, textRaw: "진료과 : 소아 청소년 과" },
      { ...baseInput, blockIndex: 13, textRaw: "[ 검사 일시 ]" },
      { ...baseInput, blockIndex: 14, textRaw: "2024-10-23 14:45" },
      { ...baseInput, blockIndex: 15, textRaw: "[ 판독 일시 ]" },
      { ...baseInput, blockIndex: 16, textRaw: "2024-10-23 17:26" },
      { ...baseInput, blockIndex: 19, textRaw: "진료 일자 : 20241025" },
      { ...baseInput, blockIndex: 20, textRaw: "진료과 : 소아 청소년 과" },
      { ...baseInput, blockIndex: 21, textRaw: "[ 검사 일시 ]" },
      { ...baseInput, blockIndex: 22, textRaw: "2024-10-25 15:54" },
      { ...baseInput, blockIndex: 23, textRaw: "[ 판독 일시 ]" },
      { ...baseInput, blockIndex: 24, textRaw: "2024-10-26 11:30" },
      { ...baseInput, blockIndex: 27, textRaw: "진료 일자 : 20241030" },
      { ...baseInput, blockIndex: 28, textRaw: "진료과 : 소아 청소년 과" },
      { ...baseInput, blockIndex: 29, textRaw: "[ 검사 일시 ]" },
      { ...baseInput, blockIndex: 30, textRaw: "2024-10-30 12:01" },
      { ...baseInput, blockIndex: 31, textRaw: "[ 판독 일시 ]" },
      { ...baseInput, blockIndex: 32, textRaw: "2024-10-30 15:42" }
    ]);

    expect(result.map((item) => item.normalizedDate)).toContain("2024-10-23");
    expect(result.map((item) => item.normalizedDate)).not.toContain("2024-10-25");
    expect(result.map((item) => item.normalizedDate)).not.toContain("2024-10-30");
  });
});
