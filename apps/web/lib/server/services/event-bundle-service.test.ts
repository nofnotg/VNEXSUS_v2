import { beforeEach, describe, expect, it, vi } from "vitest";

type PersistedEventAtom = {
  id: string;
  caseId: string;
  eventBundleId?: string | null;
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

type PersistedEventBundle = {
  id: string;
  caseId: string;
  canonicalDate: string;
  fileOrder: number;
  pageOrder: number;
  primaryHospital: string | null;
  bundleTypeCandidate: "outpatient" | "exam" | "treatment" | "procedure" | "surgery" | "admission" | "discharge" | "pathology" | "mixed" | "unknown";
  representativeDiagnosis: string | null;
  representativeTest: string | null;
  representativeTreatment: string | null;
  representativeProcedure: string | null;
  representativeSurgery: string | null;
  admissionStatus: "admitted" | "discharged" | "both" | null;
  ambiguityScore: number;
  requiresReview: boolean;
  unresolvedBundleSlotsJson: Record<string, unknown>;
  atomIdsJson: string[];
  candidateSnapshotJson: Record<string, unknown>;
  createdAt: Date;
};

const state = vi.hoisted(() => ({
  atoms: [
    {
      id: "atom-1",
      caseId: "case-1",
      eventBundleId: null,
      sourceWindowId: "window-1",
      sourceFileId: "doc-1",
      sourcePageId: "page-1",
      canonicalDate: "2024-03-07",
      fileOrder: 1,
      pageOrder: 1,
      anchorBlockIndex: 1,
      primaryHospital: "서울병원",
      primaryDepartment: "내과",
      primaryDiagnosis: "폐렴",
      primaryTest: null,
      primaryTreatment: null,
      primaryProcedure: null,
      primarySurgery: null,
      admissionStatus: null,
      pathologySummary: null,
      medicationSummary: null,
      symptomSummary: null,
      eventTypeCandidate: "outpatient" as const,
      ambiguityScore: 0.21,
      requiresReview: false,
      unresolvedSlotsJson: {
        hospitalMissing: false,
        diagnosisMissing: false,
        conflictingDiagnosis: false,
        conflictingHospital: false,
        weakEvidence: false,
        needsManualReview: false,
        notes: []
      },
      candidateSnapshotJson: {
        hospitals: ["서울병원"],
        departments: ["내과"],
        diagnoses: ["폐렴"],
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
      createdAt: new Date("2026-03-08T00:00:00.000Z")
    },
    {
      id: "atom-2",
      caseId: "case-1",
      eventBundleId: null,
      sourceWindowId: "window-2",
      sourceFileId: "doc-1",
      sourcePageId: "page-2",
      canonicalDate: "2024-03-07",
      fileOrder: 1,
      pageOrder: 2,
      anchorBlockIndex: 2,
      primaryHospital: "서울병원",
      primaryDepartment: "내과",
      primaryDiagnosis: "폐렴",
      primaryTest: "CT",
      primaryTreatment: null,
      primaryProcedure: null,
      primarySurgery: null,
      admissionStatus: null,
      pathologySummary: null,
      medicationSummary: null,
      symptomSummary: null,
      eventTypeCandidate: "outpatient" as const,
      ambiguityScore: 0.23,
      requiresReview: false,
      unresolvedSlotsJson: {
        hospitalMissing: false,
        diagnosisMissing: false,
        conflictingDiagnosis: false,
        conflictingHospital: false,
        weakEvidence: false,
        needsManualReview: false,
        notes: []
      },
      candidateSnapshotJson: {
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
        medications: [],
        symptoms: []
      },
      createdAt: new Date("2026-03-08T00:00:01.000Z")
    }
  ] as PersistedEventAtom[],
  bundles: [
    {
      id: "stale-bundle",
      caseId: "case-1",
      canonicalDate: "2020-01-01",
      fileOrder: 9,
      pageOrder: 9,
      primaryHospital: null,
      bundleTypeCandidate: "unknown" as const,
      representativeDiagnosis: null,
      representativeTest: null,
      representativeTreatment: null,
      representativeProcedure: null,
      representativeSurgery: null,
      admissionStatus: null,
      ambiguityScore: 1,
      requiresReview: true,
      unresolvedBundleSlotsJson: {
        hospitalConflict: false,
        diagnosisConflict: false,
        mixedAtomTypes: false,
        weakGrouping: true,
        needsManualReview: true,
        notes: ["stale"]
      },
      atomIdsJson: [],
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
  ] as PersistedEventBundle[]
}));

vi.mock("../../prisma", () => ({
  prisma: {
    eventAtom: {
      findMany: vi.fn(async () => [...state.atoms]),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: { eventBundleId: string } }) => {
        state.atoms = state.atoms.map((atom) =>
          atom.id === where.id ? { ...atom, eventBundleId: data.eventBundleId } : atom
        );
      })
    },
    eventBundle: {
      findMany: vi.fn(async () =>
        [...state.bundles].sort((a, b) => {
          if (a.fileOrder !== b.fileOrder) return a.fileOrder - b.fileOrder;
          if (a.pageOrder !== b.pageOrder) return a.pageOrder - b.pageOrder;
          if (a.canonicalDate !== b.canonicalDate) return a.canonicalDate.localeCompare(b.canonicalDate);
          return a.createdAt.getTime() - b.createdAt.getTime();
        })
      )
    },
    $transaction: vi.fn(async <T>(callback: (tx: any) => Promise<T>) =>
      callback({
        eventBundle: {
          deleteMany: async ({ where }: { where: { caseId: string } }) => {
            state.bundles = state.bundles.filter((item) => item.caseId !== where.caseId);
          },
          create: async ({ data }: { data: Omit<PersistedEventBundle, "id" | "createdAt"> }) => {
            const created = {
              id: `bundle-${state.bundles.length + 1}`,
              ...data,
              createdAt: new Date(`2026-03-08T00:00:0${state.bundles.length}.000Z`)
            };

            state.bundles.push(created);
            return created;
          }
        },
        eventAtom: {
          update: async ({ where, data }: { where: { id: string }; data: { eventBundleId: string } }) => {
            state.atoms = state.atoms.map((atom) =>
              atom.id === where.id ? { ...atom, eventBundleId: data.eventBundleId } : atom
            );
          }
        }
      })
    )
  }
}));

vi.mock("./case-service", () => ({
  getCaseForUser: vi.fn(async () => ({ id: "case-1" }))
}));

import { buildAndPersistEventBundles, listEventBundles } from "./event-bundle-service";

describe("event bundle service", () => {
  beforeEach(() => {
    state.bundles = [
      {
        id: "stale-bundle",
        caseId: "case-1",
        canonicalDate: "2020-01-01",
        fileOrder: 9,
        pageOrder: 9,
        primaryHospital: null,
        bundleTypeCandidate: "unknown",
        representativeDiagnosis: null,
        representativeTest: null,
        representativeTreatment: null,
        representativeProcedure: null,
        representativeSurgery: null,
        admissionStatus: null,
        ambiguityScore: 1,
        requiresReview: true,
        unresolvedBundleSlotsJson: {
          hospitalConflict: false,
          diagnosisConflict: false,
          mixedAtomTypes: false,
          weakGrouping: true,
          needsManualReview: true,
          notes: ["stale"]
        },
        atomIdsJson: [],
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
    state.atoms = state.atoms.map((atom) => ({ ...atom, eventBundleId: null }));
  });

  it("stores EventBundles from EventAtoms and links atomIds", async () => {
    const result = await buildAndPersistEventBundles("case-1");

    expect(result.bundleCount).toBe(1);
    expect(state.bundles).toHaveLength(1);
    expect(state.bundles[0]?.primaryHospital).toBe("서울병원");
    expect(state.bundles[0]?.atomIdsJson).toEqual(["atom-1", "atom-2"]);
    expect(state.atoms.every((atom) => atom.eventBundleId === "bundle-1")).toBe(true);
  });

  it("recreates bundles in order and preserves response contract fields", async () => {
    state.atoms = [
      {
        ...state.atoms[0]!,
        primaryHospital: null,
        primaryDiagnosis: "폐렴",
        eventTypeCandidate: "outpatient"
      },
      {
        ...state.atoms[1]!,
        primaryHospital: null,
        primaryDiagnosis: "기관지염",
        eventTypeCandidate: "outpatient"
      }
    ];

    await buildAndPersistEventBundles("case-1");
    const result = await listEventBundles("case-1", "user-1", "consumer");

    expect(result.every((item: (typeof result)[number]) => item.canonicalDate !== "2020-01-01")).toBe(true);
    expect(result[0]?.requiresReview).toBe(true);
    expect(result[0]?.unresolvedBundleSlotsJson.diagnosisConflict).toBe(true);
    expect(result[0]?.atomIdsJson).toEqual(["atom-1", "atom-2"]);
    expect(result[0]?.createdAt).toBe("2026-03-08T00:00:00.000Z");
  });
});
