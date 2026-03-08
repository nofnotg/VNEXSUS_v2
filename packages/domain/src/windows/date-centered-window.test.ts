import { describe, expect, it } from "vitest";
import { aggregateDateCenteredWindows } from "./date-centered-window";

describe("Date-centered window aggregation", () => {
  it("creates one window per non-admin date anchor and aggregates nearby candidates", () => {
    const result = aggregateDateCenteredWindows({
      dateCandidates: [
        {
          id: "date-1",
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 3,
          rawDateText: "2024.03.07",
          normalizedDate: "2024-03-07",
          dateTypeCandidate: "visit",
          confidence: 0.9,
          createdAt: "2026-03-08T00:00:00.000Z"
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
          candidateType: "hospital",
          rawText: "서울병원",
          normalizedText: "서울병원",
          confidence: 0.88,
          metadataJson: null,
          createdAt: "2026-03-08T00:00:00.000Z"
        },
        {
          id: "entity-2",
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          relatedDateCandidateId: "date-1",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 4,
          candidateType: "diagnosis",
          rawText: "주상병",
          normalizedText: "주상병",
          confidence: 0.8,
          metadataJson: null,
          createdAt: "2026-03-08T00:00:01.000Z"
        }
      ]
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.windowStartBlockIndex).toBe(1);
    expect(result[0]?.windowEndBlockIndex).toBe(5);
    expect(result[0]?.candidateSummaryJson.hospitals).toEqual(["서울병원"]);
    expect(result[0]?.candidateSummaryJson.diagnoses).toEqual(["주상병"]);
    expect(result[0]?.canonicalDate).toBe("2024-03-07");
  });

  it("dedupes candidates and excludes admin dates from window creation", () => {
    const result = aggregateDateCenteredWindows({
      dateCandidates: [
        {
          id: "date-admin",
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 1,
          rawDateText: "2024.03.08",
          normalizedDate: "2024-03-08",
          dateTypeCandidate: "admin",
          confidence: 0.5,
          createdAt: "2026-03-08T00:00:00.000Z"
        },
        {
          id: "date-visit",
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 6,
          rawDateText: "2024.03.09",
          normalizedDate: "2024-03-09",
          dateTypeCandidate: "visit",
          confidence: 0.9,
          createdAt: "2026-03-08T00:00:01.000Z"
        }
      ],
      entityCandidates: [
        {
          id: "entity-a",
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          relatedDateCandidateId: "date-visit",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 5,
          candidateType: "test",
          rawText: "CT",
          normalizedText: "CT",
          confidence: 0.8,
          metadataJson: null,
          createdAt: "2026-03-08T00:00:02.000Z"
        },
        {
          id: "entity-b",
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          relatedDateCandidateId: "date-visit",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 7,
          candidateType: "test",
          rawText: "CT",
          normalizedText: "CT",
          confidence: 0.7,
          metadataJson: null,
          createdAt: "2026-03-08T00:00:03.000Z"
        }
      ]
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.dateCandidateId).toBe("date-visit");
    expect(result[0]?.candidateSummaryJson.tests).toEqual(["CT"]);
  });
});
