import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildConsumerReportPdf, buildInvestigatorReportPdf } from "./pdf-builder";

describe("pdf-builder", () => {
  it("creates an investigator narrative PDF with metadata and at least one page", async () => {
    const bytes = await buildInvestigatorReportPdf({
      caseId: "case-1",
      generatedAt: "2026-03-08T00:00:00.000Z",
      requiresReview: true,
      sections: [
        {
          heading: "2024-03-07 | exam",
          paragraphs: ["On 2024-03-07, records at Seoul Hospital show Pneumonia and CT details."],
          requiresReview: true
        }
      ]
    });

    const pdf = await PDFDocument.load(bytes);

    expect(bytes.byteLength).toBeGreaterThan(500);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(pdf.getTitle()).toBe("Investigator Narrative Report - case-1");
  });

  it("creates a consumer narrative PDF with metadata and at least one page", async () => {
    const bytes = await buildConsumerReportPdf({
      caseId: "case-2",
      generatedAt: "2026-03-08T00:00:00.000Z",
      requiresReview: false,
      sections: [
        {
          heading: "timeline_summary",
          paragraphs: ["On 2024-03-07, a visit record from Seoul Hospital was identified."],
          requiresReview: false
        }
      ]
    });

    const pdf = await PDFDocument.load(bytes);

    expect(bytes.byteLength).toBeGreaterThan(500);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(pdf.getTitle()).toBe("Consumer Narrative Report - case-2");
  });

  it("creates a Korean investigator PDF with localized metadata", async () => {
    const bytes = await buildInvestigatorReportPdf(
      {
        caseId: "case-3",
        generatedAt: "2026-03-08T00:00:00.000Z",
        requiresReview: false,
        sections: [
          {
            heading: "2024-03-07 | exam",
            paragraphs: ["2024-03-07에 서울병원 관련 기록에서 폐렴이 확인되었다."],
            requiresReview: false
          }
        ]
      },
      "ko"
    );

    const pdf = await PDFDocument.load(bytes);

    expect(bytes.byteLength).toBeGreaterThan(500);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(pdf.getTitle()).toBe("조사자 내러티브 보고서 - case-3");
    expect(pdf.getSubject()).toBe("조사자 내러티브 내보내기");
  });

  it("creates a Korean consumer PDF with localized metadata", async () => {
    const bytes = await buildConsumerReportPdf(
      {
        caseId: "case-4",
        generatedAt: "2026-03-08T00:00:00.000Z",
        requiresReview: true,
        sections: [
          {
            heading: "timeline_summary",
            paragraphs: ["2024-03-07에 서울병원 방문 기록이 확인되었다."],
            requiresReview: true
          }
        ]
      },
      "ko"
    );

    const pdf = await PDFDocument.load(bytes);

    expect(bytes.byteLength).toBeGreaterThan(500);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(pdf.getTitle()).toBe("소비자 내러티브 보고서 - case-4");
    expect(pdf.getSubject()).toBe("소비자 내러티브 내보내기");
  });
});
