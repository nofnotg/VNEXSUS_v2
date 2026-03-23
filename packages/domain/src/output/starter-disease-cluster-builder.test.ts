import { describe, expect, it } from "vitest";
import { buildStarterDiseaseClusters } from "./starter-disease-cluster-builder";

describe("starter disease cluster builder", () => {
  it("produces all six in-scope cluster groups", () => {
    const clusters = buildStarterDiseaseClusters([
      {
        id: "bundle-cancer",
        caseId: "case-1",
        canonicalDate: "2024-03-01",
        fileOrder: 1,
        pageOrder: 1,
        primaryHospital: "Seoul Hospital",
        bundleTypeCandidate: "pathology",
        representativeDiagnosis: "Lung cancer",
        representativeTest: null,
        representativeTreatment: null,
        representativeProcedure: null,
        representativeSurgery: null,
        admissionStatus: null,
        ambiguityScore: 0.12,
        requiresReview: false,
        unresolvedBundleSlotsJson: {
          hospitalConflict: false,
          diagnosisConflict: false,
          mixedAtomTypes: false,
          weakGrouping: false,
          needsManualReview: false,
          notes: []
        },
        atomIdsJson: ["atom-cancer"],
        candidateSnapshotJson: {
          hospitals: ["Seoul Hospital"],
          departments: ["Oncology"],
          diagnoses: ["Lung cancer"],
          tests: [],
          treatments: [],
          procedures: [],
          surgeries: [],
          admissions: [],
          discharges: [],
          pathologies: ["adenocarcinoma"],
          medications: [],
          symptoms: []
        },
        createdAt: "2026-03-23T00:00:00.000Z"
      },
      {
        id: "bundle-heart",
        caseId: "case-1",
        canonicalDate: "2024-03-02",
        fileOrder: 1,
        pageOrder: 2,
        primaryHospital: "Seoul Hospital",
        bundleTypeCandidate: "exam",
        representativeDiagnosis: "Coronary artery disease",
        representativeTest: "Echo",
        representativeTreatment: null,
        representativeProcedure: null,
        representativeSurgery: null,
        admissionStatus: null,
        ambiguityScore: 0.18,
        requiresReview: false,
        unresolvedBundleSlotsJson: {
          hospitalConflict: false,
          diagnosisConflict: false,
          mixedAtomTypes: false,
          weakGrouping: false,
          needsManualReview: false,
          notes: []
        },
        atomIdsJson: ["atom-heart"],
        candidateSnapshotJson: {
          hospitals: ["Seoul Hospital"],
          departments: ["Cardiology"],
          diagnoses: ["Coronary artery disease"],
          tests: ["Echo"],
          treatments: [],
          procedures: [],
          surgeries: [],
          admissions: [],
          discharges: [],
          pathologies: [],
          medications: [],
          symptoms: []
        },
        createdAt: "2026-03-23T00:00:01.000Z"
      },
      {
        id: "bundle-brain",
        caseId: "case-1",
        canonicalDate: "2024-03-03",
        fileOrder: 1,
        pageOrder: 3,
        primaryHospital: "Seoul Hospital",
        bundleTypeCandidate: "exam",
        representativeDiagnosis: "Cerebral infarction",
        representativeTest: "MRI",
        representativeTreatment: null,
        representativeProcedure: null,
        representativeSurgery: null,
        admissionStatus: null,
        ambiguityScore: 0.21,
        requiresReview: false,
        unresolvedBundleSlotsJson: {
          hospitalConflict: false,
          diagnosisConflict: false,
          mixedAtomTypes: false,
          weakGrouping: false,
          needsManualReview: false,
          notes: []
        },
        atomIdsJson: ["atom-brain"],
        candidateSnapshotJson: {
          hospitals: ["Seoul Hospital"],
          departments: ["Neurology"],
          diagnoses: ["Cerebral infarction"],
          tests: ["MRI"],
          treatments: [],
          procedures: [],
          surgeries: [],
          admissions: [],
          discharges: [],
          pathologies: [],
          medications: [],
          symptoms: []
        },
        createdAt: "2026-03-23T00:00:02.000Z"
      },
      {
        id: "bundle-surgery",
        caseId: "case-1",
        canonicalDate: "2024-03-04",
        fileOrder: 1,
        pageOrder: 4,
        primaryHospital: "Seoul Hospital",
        bundleTypeCandidate: "surgery",
        representativeDiagnosis: null,
        representativeTest: null,
        representativeTreatment: null,
        representativeProcedure: null,
        representativeSurgery: "Cholecystectomy",
        admissionStatus: null,
        ambiguityScore: 0.1,
        requiresReview: false,
        unresolvedBundleSlotsJson: {
          hospitalConflict: false,
          diagnosisConflict: false,
          mixedAtomTypes: false,
          weakGrouping: false,
          needsManualReview: false,
          notes: []
        },
        atomIdsJson: ["atom-surgery"],
        candidateSnapshotJson: {
          hospitals: ["Seoul Hospital"],
          departments: ["Surgery"],
          diagnoses: [],
          tests: [],
          treatments: [],
          procedures: [],
          surgeries: ["Cholecystectomy"],
          admissions: [],
          discharges: [],
          pathologies: [],
          medications: [],
          symptoms: []
        },
        createdAt: "2026-03-23T00:00:03.000Z"
      },
      {
        id: "bundle-hospitalization",
        caseId: "case-1",
        canonicalDate: "2024-03-05",
        fileOrder: 1,
        pageOrder: 5,
        primaryHospital: "Seoul Hospital",
        bundleTypeCandidate: "admission",
        representativeDiagnosis: "Pneumonia",
        representativeTest: null,
        representativeTreatment: null,
        representativeProcedure: null,
        representativeSurgery: null,
        admissionStatus: "admitted",
        ambiguityScore: 0.15,
        requiresReview: false,
        unresolvedBundleSlotsJson: {
          hospitalConflict: false,
          diagnosisConflict: false,
          mixedAtomTypes: false,
          weakGrouping: false,
          needsManualReview: false,
          notes: []
        },
        atomIdsJson: ["atom-hospitalization"],
        candidateSnapshotJson: {
          hospitals: ["Seoul Hospital"],
          departments: ["Internal Medicine"],
          diagnoses: ["Pneumonia"],
          tests: [],
          treatments: [],
          procedures: [],
          surgeries: [],
          admissions: ["admitted"],
          discharges: [],
          pathologies: [],
          medications: [],
          symptoms: []
        },
        createdAt: "2026-03-23T00:00:04.000Z"
      },
      {
        id: "bundle-chronic",
        caseId: "case-1",
        canonicalDate: "2024-03-06",
        fileOrder: 1,
        pageOrder: 6,
        primaryHospital: "Seoul Hospital",
        bundleTypeCandidate: "outpatient",
        representativeDiagnosis: "Hypertension",
        representativeTest: null,
        representativeTreatment: null,
        representativeProcedure: null,
        representativeSurgery: null,
        admissionStatus: null,
        ambiguityScore: 0.2,
        requiresReview: false,
        unresolvedBundleSlotsJson: {
          hospitalConflict: false,
          diagnosisConflict: false,
          mixedAtomTypes: false,
          weakGrouping: false,
          needsManualReview: false,
          notes: []
        },
        atomIdsJson: ["atom-chronic"],
        candidateSnapshotJson: {
          hospitals: ["Seoul Hospital"],
          departments: ["Internal Medicine"],
          diagnoses: ["Hypertension"],
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
        createdAt: "2026-03-23T00:00:05.000Z"
      }
    ]);

    expect(clusters).toHaveLength(6);
    expect(clusters.map((cluster) => cluster.clusterType)).toEqual([
      "cancer",
      "heart",
      "brain_cerebrovascular",
      "surgery",
      "hospitalization",
      "chronic_or_other_important"
    ]);
    expect(clusters.every((cluster) => cluster.status === "present")).toBe(true);
  });

  it("preserves review_needed and representative evidence entry points honestly", () => {
    const clusters = buildStarterDiseaseClusters([
      {
        id: "bundle-review",
        caseId: "case-1",
        canonicalDate: "2024-03-01",
        fileOrder: 1,
        pageOrder: 3,
        primaryHospital: "Seoul Hospital",
        bundleTypeCandidate: "mixed",
        representativeDiagnosis: "Coronary artery disease",
        representativeTest: null,
        representativeTreatment: null,
        representativeProcedure: null,
        representativeSurgery: null,
        admissionStatus: null,
        ambiguityScore: 0.77,
        requiresReview: true,
        unresolvedBundleSlotsJson: {
          hospitalConflict: false,
          diagnosisConflict: false,
          mixedAtomTypes: true,
          weakGrouping: true,
          needsManualReview: true,
          notes: ["bundle ambiguity exceeds provisional threshold"]
        },
        atomIdsJson: ["atom-review"],
        candidateSnapshotJson: {
          hospitals: ["Seoul Hospital"],
          departments: ["Cardiology"],
          diagnoses: ["Coronary artery disease"],
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
        createdAt: "2026-03-23T00:00:00.000Z"
      }
    ]);

    const heartCluster = clusters.find((cluster) => cluster.clusterType === "heart");
    const cancerCluster = clusters.find((cluster) => cluster.clusterType === "cancer");

    expect(heartCluster?.status).toBe("review_needed");
    expect(heartCluster?.representativeEvidenceEntryPoint).toEqual({
      entryType: "event_bundle",
      eventBundleId: "bundle-review",
      fileOrder: 1,
      pageOrder: 3
    });
    expect(cancerCluster?.status).toBe("not_found");
    expect(cancerCluster?.representativeEvidenceEntryPoint).toBeNull();
  });
});
