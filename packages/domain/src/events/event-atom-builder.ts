import {
  eventAtomSchema,
  unresolvedSlotsSchema,
  type CandidateSummary,
  type DateCenteredWindowResponseContract,
  type EventAtomInput,
  type UnresolvedSlots
} from "@vnexus/shared";

function chooseRepresentative(values: string[]) {
  if (values.length === 1) {
    return { value: values[0] ?? null, conflicting: false };
  }

  if (values.length === 0) {
    return { value: null, conflicting: false };
  }

  return { value: null, conflicting: true };
}

function joinIfAny(values: string[]) {
  if (values.length === 0) {
    return null;
  }

  if (values.length === 1) {
    return values[0] ?? null;
  }

  return values.join("; ");
}

function inferAdmissionStatus(summary: CandidateSummary): EventAtomInput["admissionStatus"] {
  const hasAdmission = summary.admissions.length > 0;
  const hasDischarge = summary.discharges.length > 0;

  if (hasAdmission && hasDischarge) {
    return "both";
  }

  if (hasAdmission) {
    return "admitted";
  }

  if (hasDischarge) {
    return "discharged";
  }

  return null;
}

function inferEventType(summary: CandidateSummary): EventAtomInput["eventTypeCandidate"] {
  const hasSurgery = summary.surgeries.length > 0;
  const hasProcedure = summary.procedures.length > 0;
  const hasAdmission = summary.admissions.length > 0;
  const hasDischarge = summary.discharges.length > 0;
  const hasPathology = summary.pathologies.length > 0;
  const hasTests = summary.tests.length > 0;
  const hasTreatments = summary.treatments.length > 0;
  const hasHospitalOrDiagnosis = summary.hospitals.length > 0 || summary.diagnoses.length > 0;

  if (hasSurgery) return "surgery";
  if (hasProcedure) return "procedure";
  if (hasAdmission && hasDischarge) return "mixed";
  if (hasAdmission) return "admission";
  if (hasDischarge) return "discharge";
  if (hasPathology) return "pathology";
  if (hasTests && !hasTreatments && !hasSurgery && !hasProcedure) return "exam";
  if (hasTreatments) return "treatment";
  if (hasHospitalOrDiagnosis) return "outpatient";
  return "unknown";
}

function computeAmbiguityScore(params: {
  conflictingHospital: boolean;
  conflictingDiagnosis: boolean;
  primaryHospital: string | null;
  primaryDiagnosis: string | null;
  eventTypeCandidate: EventAtomInput["eventTypeCandidate"];
  summary: CandidateSummary;
}) {
  let score = 0.15;

  if (params.conflictingHospital) score += 0.22;
  if (params.conflictingDiagnosis) score += 0.22;
  if (!params.primaryHospital) score += 0.18;
  if (!params.primaryDiagnosis) score += 0.18;
  if (params.eventTypeCandidate === "mixed") score += 0.15;
  if (params.eventTypeCandidate === "unknown") score += 0.2;

  const activeTypes = [
    params.summary.hospitals,
    params.summary.departments,
    params.summary.diagnoses,
    params.summary.tests,
    params.summary.treatments,
    params.summary.procedures,
    params.summary.surgeries,
    params.summary.admissions,
    params.summary.discharges,
    params.summary.pathologies,
    params.summary.medications,
    params.summary.symptoms
  ].filter((values) => values.length > 0).length;

  if (activeTypes >= 5) {
    score += 0.08;
  }

  return Math.min(1, Number(score.toFixed(2)));
}

function buildUnresolvedSlots(params: {
  primaryHospital: string | null;
  primaryDiagnosis: string | null;
  conflictingHospital: boolean;
  conflictingDiagnosis: boolean;
  ambiguityScore: number;
  eventTypeCandidate: EventAtomInput["eventTypeCandidate"];
}) {
  const notes: string[] = [];

  if (!params.primaryHospital) notes.push("primaryHospital unresolved");
  if (!params.primaryDiagnosis) notes.push("primaryDiagnosis unresolved");
  if (params.conflictingHospital) notes.push("hospital candidates conflict");
  if (params.conflictingDiagnosis) notes.push("diagnosis candidates conflict");
  if (params.eventTypeCandidate === "mixed" || params.eventTypeCandidate === "unknown") {
    notes.push("eventTypeCandidate needs review");
  }
  if (params.ambiguityScore >= 0.55) {
    notes.push("ambiguity exceeds provisional threshold");
  }

  return unresolvedSlotsSchema.parse({
    hospitalMissing: !params.primaryHospital,
    diagnosisMissing: !params.primaryDiagnosis,
    conflictingDiagnosis: params.conflictingDiagnosis,
    conflictingHospital: params.conflictingHospital,
    weakEvidence: !params.primaryHospital || !params.primaryDiagnosis,
    needsManualReview:
      params.conflictingDiagnosis ||
      params.conflictingHospital ||
      params.eventTypeCandidate === "mixed" ||
      params.eventTypeCandidate === "unknown" ||
      params.ambiguityScore >= 0.55,
    notes
  });
}

export function buildProvisionalEventAtoms(
  windows: DateCenteredWindowResponseContract[],
  ambiguityThreshold = 0.55
): EventAtomInput[] {
  return windows
    .sort((a, b) => {
      if (a.fileOrder !== b.fileOrder) return a.fileOrder - b.fileOrder;
      if (a.pageOrder !== b.pageOrder) return a.pageOrder - b.pageOrder;
      return a.anchorBlockIndex - b.anchorBlockIndex;
    })
    .map((window) => {
      const primaryHospital = chooseRepresentative(window.candidateSummaryJson.hospitals);
      const primaryDepartment = chooseRepresentative(window.candidateSummaryJson.departments);
      const primaryDiagnosis = chooseRepresentative(window.candidateSummaryJson.diagnoses);
      const primaryTest = chooseRepresentative(window.candidateSummaryJson.tests);
      const primaryTreatment = chooseRepresentative(window.candidateSummaryJson.treatments);
      const primaryProcedure = chooseRepresentative(window.candidateSummaryJson.procedures);
      const primarySurgery = chooseRepresentative(window.candidateSummaryJson.surgeries);

      const admissionStatus = inferAdmissionStatus(window.candidateSummaryJson);
      const eventTypeCandidate = inferEventType(window.candidateSummaryJson);
      const ambiguityScore = computeAmbiguityScore({
        conflictingHospital: primaryHospital.conflicting,
        conflictingDiagnosis: primaryDiagnosis.conflicting,
        primaryHospital: primaryHospital.value,
        primaryDiagnosis: primaryDiagnosis.value,
        eventTypeCandidate,
        summary: window.candidateSummaryJson
      });

      const unresolvedSlotsJson: UnresolvedSlots = buildUnresolvedSlots({
        primaryHospital: primaryHospital.value,
        primaryDiagnosis: primaryDiagnosis.value,
        conflictingHospital: primaryHospital.conflicting,
        conflictingDiagnosis: primaryDiagnosis.conflicting,
        ambiguityScore,
        eventTypeCandidate
      });

      return eventAtomSchema.parse({
        caseId: window.caseId,
        sourceWindowId: window.id,
        sourceFileId: window.sourceFileId,
        sourcePageId: window.sourcePageId,
        canonicalDate: window.canonicalDate,
        fileOrder: window.fileOrder,
        pageOrder: window.pageOrder,
        anchorBlockIndex: window.anchorBlockIndex,
        primaryHospital: primaryHospital.value,
        primaryDepartment: primaryDepartment.value,
        primaryDiagnosis: primaryDiagnosis.value,
        primaryTest: primaryTest.value,
        primaryTreatment: primaryTreatment.value,
        primaryProcedure: primaryProcedure.value,
        primarySurgery: primarySurgery.value,
        admissionStatus,
        pathologySummary: joinIfAny(window.candidateSummaryJson.pathologies),
        medicationSummary: joinIfAny(window.candidateSummaryJson.medications),
        symptomSummary: joinIfAny(window.candidateSummaryJson.symptoms),
        eventTypeCandidate,
        ambiguityScore,
        requiresReview:
          unresolvedSlotsJson.conflictingDiagnosis ||
          unresolvedSlotsJson.conflictingHospital ||
          unresolvedSlotsJson.hospitalMissing ||
          unresolvedSlotsJson.diagnosisMissing ||
          unresolvedSlotsJson.needsManualReview ||
          ambiguityScore >= ambiguityThreshold,
        unresolvedSlotsJson,
        candidateSnapshotJson: window.candidateSummaryJson
      });
    });
}
