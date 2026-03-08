import { describe, expect, it } from "vitest";
import { buildProvisionalEventAtoms } from "./event-atom-builder";

describe("Provisional EventAtom builder", () => {
  it("selects single hospital and diagnosis conservatively", () => {
    const result = buildProvisionalEventAtoms([
      {
        id: "window-1",
        caseId: "case-1",
        dateCandidateId: "date-1",
        sourceFileId: "doc-1",
        sourcePageId: "page-1",
        canonicalDate: "2024-03-07",
        fileOrder: 1,
        pageOrder: 1,
        anchorBlockIndex: 3,
        windowStartBlockIndex: 1,
        windowEndBlockIndex: 5,
        candidateSummaryJson: {
          hospitals: ["서울병원"],
          departments: ["내과"],
          diagnoses: ["폐렴"],
          tests: ["CT"],
          treatments: [],
          procedures: [],
          surgeries: [],
          admissions: [],
          discharges: [],
          pathologies: [],
          medications: ["항생제"],
          symptoms: ["기침"]
        },
        createdAt: "2026-03-08T00:00:00.000Z"
      }
    ]);

    expect(result[0]?.primaryHospital).toBe("서울병원");
    expect(result[0]?.primaryDiagnosis).toBe("폐렴");
    expect(result[0]?.eventTypeCandidate).toBe("exam");
    expect(result[0]?.candidateSnapshotJson.hospitals).toEqual(["서울병원"]);
  });

  it("marks conflicting slots and admission/discharge status for review", () => {
    const result = buildProvisionalEventAtoms([
      {
        id: "window-2",
        caseId: "case-1",
        dateCandidateId: "date-2",
        sourceFileId: "doc-1",
        sourcePageId: "page-1",
        canonicalDate: "2024-03-08",
        fileOrder: 1,
        pageOrder: 1,
        anchorBlockIndex: 8,
        windowStartBlockIndex: 6,
        windowEndBlockIndex: 10,
        candidateSummaryJson: {
          hospitals: ["서울병원", "중앙병원"],
          departments: [],
          diagnoses: ["폐렴", "기관지염"],
          tests: [],
          treatments: ["치료"],
          procedures: [],
          surgeries: [],
          admissions: ["입원"],
          discharges: ["퇴원"],
          pathologies: [],
          medications: [],
          symptoms: []
        },
        createdAt: "2026-03-08T00:00:00.000Z"
      }
    ]);

    expect(result[0]?.primaryHospital).toBeNull();
    expect(result[0]?.primaryDiagnosis).toBeNull();
    expect(result[0]?.admissionStatus).toBe("both");
    expect(result[0]?.eventTypeCandidate).toBe("mixed");
    expect(result[0]?.unresolvedSlotsJson.conflictingHospital).toBe(true);
    expect(result[0]?.unresolvedSlotsJson.conflictingDiagnosis).toBe(true);
    expect(result[0]?.requiresReview).toBe(true);
    expect(result[0]?.ambiguityScore).toBeGreaterThanOrEqual(0.55);
  });
});
