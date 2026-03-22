import {
  candidateSummarySchema,
  dateCenteredWindowSchema,
  type CandidateSummary,
  type DateCandidateResponseContract,
  type DateCenteredWindowInput,
  type EntityCandidateResponseContract
} from "@vnexus/shared";
import { canonicalizeHospitalName } from "../entities/hospital-normalization";

export type DateCenteredWindowInputSource = {
  dateCandidates: DateCandidateResponseContract[];
  entityCandidates: EntityCandidateResponseContract[];
};

function createEmptySummary(): CandidateSummary {
  return candidateSummarySchema.parse({
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
  });
}

function dedupe(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function appendCandidate(summary: CandidateSummary, candidate: EntityCandidateResponseContract) {
  switch (candidate.candidateType) {
    case "hospital":
      summary.hospitals.push(candidate.normalizedText);
      break;
    case "department":
      summary.departments.push(candidate.normalizedText);
      break;
    case "diagnosis":
      summary.diagnoses.push(candidate.normalizedText);
      break;
    case "test":
      summary.tests.push(candidate.normalizedText);
      break;
    case "treatment":
      summary.treatments.push(candidate.normalizedText);
      break;
    case "procedure":
      summary.procedures.push(candidate.normalizedText);
      break;
    case "surgery":
      summary.surgeries.push(candidate.normalizedText);
      break;
    case "admission":
      summary.admissions.push(candidate.normalizedText);
      break;
    case "discharge":
      summary.discharges.push(candidate.normalizedText);
      break;
    case "pathology":
      summary.pathologies.push(candidate.normalizedText);
      break;
    case "medication":
      summary.medications.push(candidate.normalizedText);
      break;
    case "symptom":
      summary.symptoms.push(candidate.normalizedText);
      break;
    default:
      break;
  }
}

function finalizeSummary(summary: CandidateSummary): CandidateSummary {
  return candidateSummarySchema.parse({
    hospitals: dedupe(summary.hospitals.map((hospital) => canonicalizeHospitalName(hospital) ?? hospital)),
    departments: dedupe(summary.departments),
    diagnoses: dedupe(summary.diagnoses),
    tests: dedupe(summary.tests),
    treatments: dedupe(summary.treatments),
    procedures: dedupe(summary.procedures),
    surgeries: dedupe(summary.surgeries),
    admissions: dedupe(summary.admissions),
    discharges: dedupe(summary.discharges),
    pathologies: dedupe(summary.pathologies),
    medications: dedupe(summary.medications),
    symptoms: dedupe(summary.symptoms)
  });
}

function hasClinicalAnchors(summary: CandidateSummary) {
  return (
    summary.hospitals.length > 0 ||
    summary.departments.length > 0 ||
    summary.diagnoses.length > 0 ||
    summary.tests.length > 0 ||
    summary.treatments.length > 0 ||
    summary.procedures.length > 0 ||
    summary.surgeries.length > 0 ||
    summary.admissions.length > 0 ||
    summary.discharges.length > 0 ||
    summary.pathologies.length > 0
  );
}

function collectFallbackHospitals(
  dateCandidate: DateCandidateResponseContract,
  entityCandidates: EntityCandidateResponseContract[],
  summary: CandidateSummary
) {
  if (summary.hospitals.length > 0) {
    return;
  }

  const fallbackHospitals = entityCandidates
    .filter(
      (candidate) =>
        candidate.sourceFileId === dateCandidate.sourceFileId &&
        candidate.candidateType === "hospital" &&
        Math.abs(candidate.pageOrder - dateCandidate.pageOrder) <= 1 &&
        Math.abs(candidate.blockIndex - dateCandidate.blockIndex) <= 8
    )
    .sort((left, right) => {
      const leftDistance = Math.abs(left.pageOrder - dateCandidate.pageOrder) * 100 + Math.abs(left.blockIndex - dateCandidate.blockIndex);
      const rightDistance =
        Math.abs(right.pageOrder - dateCandidate.pageOrder) * 100 + Math.abs(right.blockIndex - dateCandidate.blockIndex);
      return leftDistance - rightDistance;
    })
    .slice(0, 2);

  for (const hospitalCandidate of fallbackHospitals) {
    appendCandidate(summary, hospitalCandidate);
  }
}

export function aggregateDateCenteredWindows(input: DateCenteredWindowInputSource): DateCenteredWindowInput[] {
  const sortedDates = [...input.dateCandidates].sort((a, b) => {
    if (a.fileOrder !== b.fileOrder) return a.fileOrder - b.fileOrder;
    if (a.pageOrder !== b.pageOrder) return a.pageOrder - b.pageOrder;
    return a.blockIndex - b.blockIndex;
  });

  const windows: DateCenteredWindowInput[] = [];

  for (const dateCandidate of sortedDates) {
    if (["admin", "plan"].includes(dateCandidate.dateTypeCandidate)) {
      continue;
    }

    const windowStartBlockIndex = Math.max(0, dateCandidate.blockIndex - 2);
    const windowEndBlockIndex = dateCandidate.blockIndex + 2;

    const summary = createEmptySummary();
    const nearbyCandidates = input.entityCandidates
      .filter(
        (candidate) =>
          candidate.sourcePageId === dateCandidate.sourcePageId &&
          candidate.blockIndex >= windowStartBlockIndex &&
          candidate.blockIndex <= windowEndBlockIndex
      )
      .sort((a, b) => a.blockIndex - b.blockIndex);

    for (const candidate of nearbyCandidates) {
      appendCandidate(summary, candidate);
    }

    collectFallbackHospitals(dateCandidate, input.entityCandidates, summary);

    const finalizedSummary = finalizeSummary(summary);
    if (!hasClinicalAnchors(finalizedSummary)) {
      continue;
    }

    windows.push(
      dateCenteredWindowSchema.parse({
        caseId: dateCandidate.caseId,
        dateCandidateId: dateCandidate.id,
        sourceFileId: dateCandidate.sourceFileId,
        sourcePageId: dateCandidate.sourcePageId,
        canonicalDate: dateCandidate.normalizedDate,
        fileOrder: dateCandidate.fileOrder,
        pageOrder: dateCandidate.pageOrder,
        anchorBlockIndex: dateCandidate.blockIndex,
        windowStartBlockIndex,
        windowEndBlockIndex,
        candidateSummaryJson: finalizedSummary
      })
    );
  }

  return windows;
}
