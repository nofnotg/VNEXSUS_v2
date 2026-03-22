import { describe, expect, it } from "vitest";
import { aggregateDateCenteredWindows } from "./date-centered-window";

describe("Date-centered window aggregation", () => {
  it("creates one window for a clinical date anchor and canonicalizes hospitals", () => {
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
          rawText: "SM \uC601\uC0C1\uC758\uD559\uACFC \uC758\uC6D0",
          normalizedText: "SM \uC601\uC0C1\uC758\uD559\uACFC \uC758\uC6D0",
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
          rawText: "\uC8FC\uC0C1\uBCD1",
          normalizedText: "\uC8FC\uC0C1\uBCD1",
          confidence: 0.8,
          metadataJson: null,
          createdAt: "2026-03-08T00:00:01.000Z"
        }
      ]
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.candidateSummaryJson.hospitals).toEqual(["\uC5D0\uC2A4\uC5E0\uC601\uC0C1\uC758\uD559\uACFC\uC758\uC6D0"]);
    expect(result[0]?.candidateSummaryJson.diagnoses).toEqual(["\uC8FC\uC0C1\uBCD1"]);
  });

  it("skips plan dates and context-free visit dates", () => {
    const result = aggregateDateCenteredWindows({
      dateCandidates: [
        {
          id: "date-plan",
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 1,
          rawDateText: "2024.03.08",
          normalizedDate: "2024-03-08",
          dateTypeCandidate: "plan",
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
          blockIndex: 9,
          candidateType: "unknown",
          rawText: "\uBE44\uACE0",
          normalizedText: "\uBE44\uACE0",
          confidence: 0.4,
          metadataJson: null,
          createdAt: "2026-03-08T00:00:02.000Z"
        }
      ]
    });

    expect(result).toHaveLength(0);
  });

  it("carries forward nearby hospital context when the local window lacks one", () => {
    const result = aggregateDateCenteredWindows({
      dateCandidates: [
        {
          id: "date-2",
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-2",
          fileOrder: 1,
          pageOrder: 2,
          blockIndex: 12,
          rawDateText: "2024.03.10",
          normalizedDate: "2024-03-10",
          dateTypeCandidate: "visit",
          confidence: 0.88,
          createdAt: "2026-03-08T00:00:03.000Z"
        }
      ],
      entityCandidates: [
        {
          id: "entity-hospital",
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-1",
          relatedDateCandidateId: null,
          fileOrder: 1,
          pageOrder: 1,
          blockIndex: 8,
          candidateType: "hospital",
          rawText: "\uAD6D\uBBFC\uAC74\uAC15\uBCF4\uD5D8\uACF5\uB2E8 \uC77C\uC0B0\uBCD1\uC6D0",
          normalizedText: "\uAD6D\uBBFC\uAC74\uAC15\uBCF4\uD5D8 \uC77C\uC0B0\uBCD1\uC6D0",
          confidence: 0.86,
          metadataJson: null,
          createdAt: "2026-03-08T00:00:00.000Z"
        },
        {
          id: "entity-diagnosis",
          caseId: "case-1",
          sourceFileId: "doc-1",
          sourcePageId: "page-2",
          relatedDateCandidateId: "date-2",
          fileOrder: 1,
          pageOrder: 2,
          blockIndex: 13,
          candidateType: "diagnosis",
          rawText: "\uC8FC\uC0C1\uBCD1",
          normalizedText: "\uC8FC\uC0C1\uBCD1",
          confidence: 0.8,
          metadataJson: null,
          createdAt: "2026-03-08T00:00:04.000Z"
        }
      ]
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.candidateSummaryJson.hospitals).toEqual(["\uAD6D\uBBFC\uAC74\uAC15\uBCF4\uD5D8 \uC77C\uC0B0\uBCD1\uC6D0"]);
    expect(result[0]?.candidateSummaryJson.diagnoses).toEqual(["\uC8FC\uC0C1\uBCD1"]);
  });
});
