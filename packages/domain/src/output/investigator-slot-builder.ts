import {
  investigatorSlotJsonSchema,
  type EventBundleResponseContract,
  type InvestigatorSlotBundle,
  type InvestigatorSlotJson
} from "@vnexus/shared";
import { deriveBundleQualityGate } from "../bundles/event-bundle-builder";

function pickDepartment(bundle: EventBundleResponseContract) {
  const departments = bundle.candidateSnapshotJson.departments;
  return departments.length === 1 ? (departments[0] ?? null) : null;
}

function createNotes(bundle: EventBundleResponseContract) {
  const qualityGate = deriveBundleQualityGate(bundle);
  const notes = [...bundle.unresolvedBundleSlotsJson.notes];

  if (
    qualityGate.bundleQualityState === "insufficient" &&
    !notes.includes("bundle evidence is insufficient for clean structured output")
  ) {
    notes.push("bundle evidence is insufficient for clean structured output");
  }

  return notes;
}

export function buildInvestigatorStructuredOutput(
  caseId: string,
  bundles: EventBundleResponseContract[],
  generatedAt = new Date().toISOString()
): InvestigatorSlotJson {
  const mappedBundles: InvestigatorSlotBundle[] = [...bundles]
    .sort((a, b) => {
      if (a.fileOrder !== b.fileOrder) return a.fileOrder - b.fileOrder;
      if (a.pageOrder !== b.pageOrder) return a.pageOrder - b.pageOrder;
      return a.canonicalDate.localeCompare(b.canonicalDate);
    })
    .map((bundle) => {
      const bundleQualityGate = deriveBundleQualityGate(bundle);

      return {
        eventBundleId: bundle.id,
        canonicalDate: bundle.canonicalDate,
        hospital: bundle.primaryHospital ?? null,
        department: pickDepartment(bundle),
        diagnosis: bundle.representativeDiagnosis ?? null,
        test: bundle.representativeTest ?? null,
        treatment: bundle.representativeTreatment ?? null,
        procedure: bundle.representativeProcedure ?? null,
        surgery: bundle.representativeSurgery ?? null,
        admissionStatus: bundle.admissionStatus ?? null,
        pathologySummary:
          bundle.candidateSnapshotJson.pathologies.length > 0
            ? bundle.candidateSnapshotJson.pathologies.join("; ")
            : null,
        medicationSummary:
          bundle.candidateSnapshotJson.medications.length > 0
            ? bundle.candidateSnapshotJson.medications.join("; ")
            : null,
        symptomSummary:
          bundle.candidateSnapshotJson.symptoms.length > 0
            ? bundle.candidateSnapshotJson.symptoms.join("; ")
            : null,
        bundleTypeCandidate: bundle.bundleTypeCandidate,
        ambiguityScore: bundle.ambiguityScore,
        requiresReview: bundle.requiresReview || bundleQualityGate.bundleQualityState !== "supported",
        bundleQualityGate,
        notes: createNotes(bundle)
      };
    });

  return investigatorSlotJsonSchema.parse({
    caseId,
    generatedAt,
    bundles: mappedBundles
  });
}
