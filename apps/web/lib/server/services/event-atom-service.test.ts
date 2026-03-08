import { beforeEach, describe, expect, it, vi } from "vitest";

type PersistedEventAtom = {
  id: string;
  caseId: string;
  sourceWindowId: string;
  sourceFileId: string;
  sourcePageId: string;
  canonicalDate: string;
  fileOrder: number;
  pageOrder: number;
  anchorBlockIndex: number;
  primaryHospital: string | null;
  primaryDepartment: string | null;
  primaryDiagnosis: string | null;
  primaryTest: string | null;
  primaryTreatment: string | null;
  primaryProcedure: string | null;
  primarySurgery: string | null;
  admissionStatus: "admitted" | "discharged" | "both" | null;
  pathologySummary: string | null;
  medicationSummary: string | null;
  symptomSummary: string | null;
  eventTypeCandidate: "outpatient" | "exam" | "treatment" | "procedure" | "surgery" | "admission" | "discharge" | "pathology" | "followup" | "mixed" | "unknown";
  ambiguityScore: number;
  requiresReview: boolean;
  unresolvedSlotsJson: Record<string, unknown>;
  candidateSnapshotJson: Record<string, unknown>;
  createdAt: Date;
};

type PersistedDateCenteredWindow = {
  id: string;
  caseId: string;
  dateCandidateId: string;
  sourceFileId: string;
  sourcePageId: string;
  canonicalDate: string;
  fileOrder: number;
  pageOrder: number;
  anchorBlockIndex: number;
  windowStartBlockIndex: number;
  windowEndBlockIndex: number;
  candidateSummaryJson: {
    hospitals: string[];
    departments: string[];
    diagnoses: string[];
    tests: string[];
    treatments: string[];
    procedures: string[];
    surgeries: string[];
    admissions: string[];
    discharges: string[];
    pathologies: string[];
    medications: string[];
    symptoms: string[];
  };
  createdAt: Date;
};

const state = vi.hoisted(() => ({
  windows: [
    {
      id: "window-1",
      caseId: "case-1",
      dateCandidateId: "date-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      canonicalDate: "2024-03-07",
      fileOrder: 1,
      pageOrder: 1,
      anchorBlockIndex: 2,
      windowStartBlockIndex: 0,
      windowEndBlockIndex: 4,
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
      createdAt: new Date("2026-03-08T00:00:00.000Z")
    }
  ] as PersistedDateCenteredWindow[],
  atoms: [
    {
      id: "stale-atom",
      caseId: "case-1",
      sourceWindowId: "old-window",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      canonicalDate: "2020-01-01",
      fileOrder: 9,
      pageOrder: 9,
      anchorBlockIndex: 9,
      primaryHospital: null,
      primaryDepartment: null,
      primaryDiagnosis: null,
      primaryTest: null,
      primaryTreatment: null,
      primaryProcedure: null,
      primarySurgery: null,
      admissionStatus: null,
      pathologySummary: null,
      medicationSummary: null,
      symptomSummary: null,
      eventTypeCandidate: "unknown" as const,
      ambiguityScore: 1,
      requiresReview: true,
      unresolvedSlotsJson: {
        hospitalMissing: true,
        diagnosisMissing: true,
        conflictingDiagnosis: false,
        conflictingHospital: false,
        weakEvidence: true,
        needsManualReview: true,
        notes: ["stale"]
      },
      candidateSnapshotJson: {
        hospitals: [],
        departments: [],
        diagnoses: [],
        tests: [],
        treatments: [],
        procedures: [],
        surgeries: [],
        admissions: [],
        discharges: [],
        pathologies: [],
        medications: [],
        symptoms: []
      },
      createdAt: new Date("2026-03-08T00:00:09.000Z")
    }
  ] as PersistedEventAtom[]
}));

vi.mock("../../prisma", () => ({
  prisma: {
    dateCenteredWindow: {
      findMany: vi.fn(async () => [...state.windows])
    },
    eventAtom: {
      findMany: vi.fn(async () =>
        [...state.atoms].sort((a, b) => {
          if (a.fileOrder !== b.fileOrder) return a.fileOrder - b.fileOrder;
          if (a.pageOrder !== b.pageOrder) return a.pageOrder - b.pageOrder;
          if (a.anchorBlockIndex !== b.anchorBlockIndex) return a.anchorBlockIndex - b.anchorBlockIndex;
          return a.createdAt.getTime() - b.createdAt.getTime();
        })
      )
    },
    $transaction: vi.fn(async <T>(callback: (tx: any) => Promise<T>) =>
      callback({
        eventAtom: {
          deleteMany: async ({ where }: { where: { caseId: string } }) => {
            state.atoms = state.atoms.filter((item) => item.caseId !== where.caseId);
          },
          createMany: async ({ data }: { data: Array<Omit<PersistedEventAtom, "id" | "createdAt">> }) => {
            data.forEach((item, index) => {
              state.atoms.push({
                id: `atom-${state.atoms.length + index + 1}`,
                ...item,
                createdAt: new Date(`2026-03-08T00:00:0${index}.000Z`)
              });
            });
          }
        }
      })
    )
  }
}));

vi.mock("./case-service", () => ({
  getCaseForUser: vi.fn(async () => ({ id: "case-1" }))
}));

import { buildAndPersistEventAtoms, listEventAtoms } from "./event-atom-service";

describe("event atom service", () => {
  beforeEach(() => {
    state.atoms = [
      {
        id: "stale-atom",
        caseId: "case-1",
        sourceWindowId: "old-window",
        sourceFileId: "doc-1",
        sourcePageId: "page-1",
        canonicalDate: "2020-01-01",
        fileOrder: 9,
        pageOrder: 9,
        anchorBlockIndex: 9,
        primaryHospital: null,
        primaryDepartment: null,
        primaryDiagnosis: null,
        primaryTest: null,
        primaryTreatment: null,
        primaryProcedure: null,
        primarySurgery: null,
        admissionStatus: null,
        pathologySummary: null,
        medicationSummary: null,
        symptomSummary: null,
        eventTypeCandidate: "unknown",
        ambiguityScore: 1,
        requiresReview: true,
        unresolvedSlotsJson: {
          hospitalMissing: true,
          diagnosisMissing: true,
          conflictingDiagnosis: false,
          conflictingHospital: false,
          weakEvidence: true,
          needsManualReview: true,
          notes: ["stale"]
        },
        candidateSnapshotJson: {
          hospitals: [],
          departments: [],
          diagnoses: [],
          tests: [],
          treatments: [],
          procedures: [],
          surgeries: [],
          admissions: [],
          discharges: [],
          pathologies: [],
          medications: [],
          symptoms: []
        },
        createdAt: new Date("2026-03-08T00:00:09.000Z")
      }
    ];
  });

  it("stores provisional EventAtoms from date-centered windows", async () => {
    const result = await buildAndPersistEventAtoms("case-1");

    expect(result.atomCount).toBe(1);
    expect(state.atoms[0]?.primaryHospital).toBe("서울병원");
    expect(state.atoms[0]?.primaryDiagnosis).toBe("폐렴");
    expect(state.atoms[0]?.requiresReview).toBe(false);
  });

  it("recreates atoms in order and returns review flags", async () => {
    const baseWindow = state.windows[0];
    expect(baseWindow).toBeDefined();
    if (!baseWindow) {
      throw new Error("Expected base window test fixture to exist");
    }

    state.windows = [
      {
        ...baseWindow,
        candidateSummaryJson: {
          hospitals: ["서울병원", "중앙병원"],
          departments: [],
          diagnoses: [],
          tests: [],
          treatments: ["치료"],
          procedures: [],
          surgeries: [],
          admissions: ["입원"],
          discharges: ["퇴원"],
          pathologies: [],
          medications: [],
          symptoms: []
        }
      }
    ];

    await buildAndPersistEventAtoms("case-1");
    const result = await listEventAtoms("case-1", "user-1", "consumer");

    expect(result.every((item: (typeof result)[number]) => item.canonicalDate !== "2020-01-01")).toBe(true);
    expect(result[0]?.requiresReview).toBe(true);
    expect(result[0]?.unresolvedSlotsJson.conflictingHospital).toBe(true);
    expect(result[0]?.createdAt).toBe("2026-03-08T00:00:00.000Z");
  });
});
