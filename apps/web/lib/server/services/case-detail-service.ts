import {
  ApiError,
  caseDetailSchema,
  caseEventEditSchema,
  caseEventSchema,
  type CaseDetail,
  type CaseEvent,
  type CaseEventEdit,
  type EventEditHistory,
  type UserRole
} from "@vnexus/shared";
import { caseDetailRepository } from "../data-access/case-detail-repository";

type CaseDetailRepositoryRecord = Awaited<ReturnType<typeof caseDetailRepository.findCaseDetail>> extends infer T
  ? Exclude<T, null>
  : never;
type CaseDetailReader = {
  findCaseDetail: typeof caseDetailRepository.findCaseDetail;
};
type CaseDetailConfirmationWriter = {
  updateEventConfirmation: typeof caseDetailRepository.updateEventConfirmation;
};
type CaseDetailEditWriter = {
  updateEventDetails: typeof caseDetailRepository.updateEventDetails;
};

function isAllowedCaseRole(role: UserRole) {
  return role === "consumer" || role === "investigator" || role === "admin";
}

function canEditEvents(role: UserRole) {
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

function parseEditHistory(value: unknown): EventEditHistory[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const parsed = caseEventSchema.shape.editHistory.unwrap().element.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

function resolveHospital(record: CaseDetailRepositoryRecord, atom: CaseDetailRepositoryRecord["eventAtoms"][number]) {
  return atom.primaryHospital ?? record.patientInput?.insuranceCompany ?? "Unknown hospital";
}

function resolveBaseDetails(atom: CaseDetailRepositoryRecord["eventAtoms"][number]) {
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

function resolveLatestOverride(history: EventEditHistory[], field: keyof EventEditHistory["changes"]) {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const entry = history[index];
    const change = entry?.changes[field];
    if (change) {
      return change.nextValue;
    }
  }

  return null;
}

function mapAtomToCaseEvent(record: CaseDetailRepositoryRecord, atom: CaseDetailRepositoryRecord["eventAtoms"][number]): CaseEvent {
  const editHistory = parseEditHistory(atom.editHistory);
  const detail = caseEventSchema.parse({
    eventId: atom.id,
    type: resolveEventType(atom.eventTypeCandidate),
    date: atom.canonicalDate,
    hospital: resolveHospital(record, atom),
    details: resolveLatestOverride(editHistory, "details") ?? resolveBaseDetails(atom),
    confirmed: atom.confirmed,
    requiresReview: atom.requiresReview,
    editedAt: atom.editedAt?.toISOString() ?? null,
    editHistory,
    metadata: {
      fileOrder: atom.fileOrder,
      pageOrder: atom.pageOrder,
      anchorBlockIndex: atom.anchorBlockIndex,
      eventBundleId: atom.eventBundleId,
      sourceFileId: atom.sourceFileId,
      sourcePageId: atom.sourcePageId
    }
  });

  return detail;
}

function buildEditHistoryEntry(
  userId: string,
  editedAt: string,
  currentEvent: CaseEvent,
  edit: CaseEventEdit
): EventEditHistory | null {
  const changes: EventEditHistory["changes"] = {};

  if (edit.date !== undefined && edit.date !== currentEvent.date) {
    changes.date = {
      previousValue: currentEvent.date,
      nextValue: edit.date
    };
  }

  if (edit.hospital !== undefined && edit.hospital !== currentEvent.hospital) {
    changes.hospital = {
      previousValue: currentEvent.hospital,
      nextValue: edit.hospital
    };
  }

  if (edit.details !== undefined && edit.details !== currentEvent.details) {
    changes.details = {
      previousValue: currentEvent.details,
      nextValue: edit.details
    };
  }

  if (edit.requiresReview !== undefined && edit.requiresReview !== currentEvent.requiresReview) {
    changes.requiresReview = {
      previousValue: currentEvent.requiresReview ? "true" : "false",
      nextValue: edit.requiresReview ? "true" : "false"
    };
  }

  if (Object.keys(changes).length === 0) {
    return null;
  }

  return {
    editedBy: userId,
    editedAt,
    changes
  };
}

export async function getCaseDetail(
  caseId: string,
  userId: string,
  role: UserRole,
  repository: CaseDetailReader = caseDetailRepository
): Promise<CaseDetail> {
  if (!isAllowedCaseRole(role)) {
    throw new ApiError("FORBIDDEN", "This role cannot open case detail");
  }

  const record = await repository.findCaseDetail(caseId, userId, role === "admin");
  if (!record) {
    throw new ApiError("NOT_FOUND", "Case not found");
  }

  return caseDetailSchema.parse({
    caseId: record.id,
    hospitalName: record.eventAtoms.find((item) => item.primaryHospital)?.primaryHospital ?? record.patientInput?.insuranceCompany ?? null,
    events: record.eventAtoms.map((atom) => mapAtomToCaseEvent(record, atom))
  });
}

export async function updateEventConfirmation(
  caseId: string,
  eventId: string,
  confirmed: boolean,
  userId: string,
  role: UserRole,
  repository: CaseDetailReader & CaseDetailConfirmationWriter = caseDetailRepository
): Promise<void> {
  if (!canEditEvents(role)) {
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

export async function updateEventDetails(
  caseId: string,
  userId: string,
  role: UserRole,
  edit: CaseEventEdit,
  lastKnownEditedAt?: string | null,
  repository: CaseDetailReader & CaseDetailEditWriter = caseDetailRepository
): Promise<CaseEvent> {
  if (!canEditEvents(role)) {
    throw new ApiError("FORBIDDEN", "This role cannot edit case events");
  }

  const parsedEdit = caseEventEditSchema.parse(edit);
  const record = await repository.findCaseDetail(caseId, userId, role === "admin");
  if (!record) {
    throw new ApiError("NOT_FOUND", "Case not found");
  }

  const atom = record.eventAtoms.find((item) => item.id === parsedEdit.eventId);
  if (!atom) {
    throw new ApiError("NOT_FOUND", "Event not found");
  }

  if (lastKnownEditedAt && atom.editedAt && atom.editedAt.toISOString() !== lastKnownEditedAt) {
    throw new ApiError("CONFLICT", "Event was updated by another user");
  }

  const currentEvent = mapAtomToCaseEvent(record, atom);
  const editedAt = new Date().toISOString();
  const nextHistoryEntry = buildEditHistoryEntry(userId, editedAt, currentEvent, parsedEdit);

  if (!nextHistoryEntry) {
    return currentEvent;
  }

  const nextHistory = [...parseEditHistory(atom.editHistory), nextHistoryEntry];

  await repository.updateEventDetails(parsedEdit.eventId, {
    ...(parsedEdit.date !== undefined ? { canonicalDate: parsedEdit.date } : {}),
    ...(parsedEdit.hospital !== undefined ? { primaryHospital: parsedEdit.hospital } : {}),
    ...(parsedEdit.requiresReview !== undefined ? { requiresReview: parsedEdit.requiresReview } : {}),
    editedAt: new Date(editedAt),
    editHistory: nextHistory
  });

  return caseEventSchema.parse({
    ...currentEvent,
    ...(parsedEdit.date !== undefined ? { date: parsedEdit.date } : {}),
    ...(parsedEdit.hospital !== undefined ? { hospital: parsedEdit.hospital } : {}),
    ...(parsedEdit.details !== undefined ? { details: parsedEdit.details } : {}),
    ...(parsedEdit.requiresReview !== undefined ? { requiresReview: parsedEdit.requiresReview } : {}),
    editedAt,
    editHistory: nextHistory
  });
}
