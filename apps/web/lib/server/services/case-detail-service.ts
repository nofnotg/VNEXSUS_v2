import { ApiError, caseDetailSchema, type CaseDetail, type UserRole } from "@vnexus/shared";
import { caseDetailRepository } from "../data-access/case-detail-repository";

function isAllowedCaseRole(role: UserRole) {
  return role === "consumer" || role === "investigator" || role === "admin";
}

function canEditConfirmation(role: UserRole) {
  return role === "investigator" || role === "admin";
}

function resolveEventType(
  candidate: CaseDetailRepositoryRecord["eventAtoms"][number]["eventTypeCandidate"]
): CaseDetail["events"][number]["type"] {
  if (candidate === "outpatient") {
    return "visit";
  }

  if (candidate === "exam") {
    return "exam";
  }

  if (candidate === "treatment") {
    return "treatment";
  }

  if (candidate === "procedure") {
    return "procedure";
  }

  if (candidate === "surgery") {
    return "surgery";
  }

  if (candidate === "admission") {
    return "admission";
  }

  if (candidate === "discharge") {
    return "discharge";
  }

  if (candidate === "pathology") {
    return "pathology";
  }

  if (candidate === "followup") {
    return "followup";
  }

  return "other";
}

function resolveHospital(record: CaseDetailRepositoryRecord, atom: CaseDetailRepositoryRecord["eventAtoms"][number]) {
  return atom.primaryHospital ?? record.patientInput?.insuranceCompany ?? "Unknown hospital";
}

function resolveDetails(atom: CaseDetailRepositoryRecord["eventAtoms"][number]) {
  const parts = [
    atom.primaryDiagnosis,
    atom.primaryTest,
    atom.primaryTreatment,
    atom.primaryProcedure,
    atom.primarySurgery,
    atom.pathologySummary,
    atom.medicationSummary,
    atom.symptomSummary
  ].filter((value): value is string => Boolean(value?.trim()));

  if (atom.primaryDepartment) {
    parts.unshift(`Department: ${atom.primaryDepartment}`);
  }

  if (atom.admissionStatus) {
    parts.push(`Admission status: ${atom.admissionStatus}`);
  }

  return parts.length > 0 ? parts.join(" | ") : "No confirmed medical details yet";
}

type CaseDetailRepositoryRecord = Awaited<ReturnType<typeof caseDetailRepository.findCaseDetail>> extends infer T
  ? Exclude<T, null>
  : never;

export async function getCaseDetail(
  caseId: string,
  userId: string,
  role: UserRole,
  repository: Pick<typeof caseDetailRepository, "findCaseDetail"> = caseDetailRepository
): Promise<CaseDetail> {
  if (!isAllowedCaseRole(role)) {
    throw new ApiError("FORBIDDEN", "This role cannot open case detail");
  }

  const record = await repository.findCaseDetail(caseId, userId, role === "admin");
  if (!record) {
    throw new ApiError("NOT_FOUND", "Case not found");
  }

  const detail = caseDetailSchema.parse({
    caseId: record.id,
    hospitalName: record.eventAtoms.find((item) => item.primaryHospital)?.primaryHospital ?? record.patientInput?.insuranceCompany ?? null,
    events: record.eventAtoms.map((atom) => ({
      eventId: atom.id,
      type: resolveEventType(atom.eventTypeCandidate),
      date: atom.canonicalDate,
      hospital: resolveHospital(record, atom),
      details: resolveDetails(atom),
      confirmed: atom.confirmed,
      requiresReview: atom.requiresReview,
      metadata: {
        fileOrder: atom.fileOrder,
        pageOrder: atom.pageOrder,
        anchorBlockIndex: atom.anchorBlockIndex,
        eventBundleId: atom.eventBundleId,
        sourceFileId: atom.sourceFileId,
        sourcePageId: atom.sourcePageId
      }
    }))
  });

  return detail;
}

export async function updateEventConfirmation(
  caseId: string,
  eventId: string,
  confirmed: boolean,
  userId: string,
  role: UserRole,
  repository: Pick<typeof caseDetailRepository, "findCaseDetail" | "updateEventConfirmation"> = caseDetailRepository
): Promise<void> {
  if (!canEditConfirmation(role)) {
    throw new ApiError("FORBIDDEN", "This role cannot confirm case events");
  }

  const record = await repository.findCaseDetail(caseId, userId, role === "admin");
  if (!record) {
    throw new ApiError("NOT_FOUND", "Case not found");
  }

  const targetEvent = record.eventAtoms.find((item) => item.id === eventId);
  if (!targetEvent) {
    throw new ApiError("NOT_FOUND", "Event not found");
  }

  await repository.updateEventConfirmation(eventId, confirmed);
}
