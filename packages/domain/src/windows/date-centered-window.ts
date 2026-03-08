import {
  candidateSummarySchema,
  dateCenteredWindowSchema,
  type CandidateSummary,
  type DateCandidateResponseContract,
  type DateCenteredWindowInput,
  type EntityCandidateResponseContract
} from "@vnexus/shared";

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
    hospitals: dedupe(summary.hospitals),
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

export function aggregateDateCenteredWindows(input: DateCenteredWindowInputSource): DateCenteredWindowInput[] {
  const sortedDates = [...input.dateCandidates].sort((a, b) => {
    if (a.fileOrder !== b.fileOrder) return a.fileOrder - b.fileOrder;
    if (a.pageOrder !== b.pageOrder) return a.pageOrder - b.pageOrder;
    return a.blockIndex - b.blockIndex;
  });

  const windows: DateCenteredWindowInput[] = [];

  for (const dateCandidate of sortedDates) {
    if (dateCandidate.dateTypeCandidate === "admin") {
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
        candidateSummaryJson: finalizeSummary(summary)
      })
    );
  }

  return windows;
}
