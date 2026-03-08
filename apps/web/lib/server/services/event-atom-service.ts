import { Prisma } from "@prisma/client";
import { buildProvisionalEventAtoms } from "@vnexus/domain";
import { ApiError, eventAtomResponseContractSchema, type UserRole } from "@vnexus/shared";
import { prisma } from "../../prisma";
import { getCaseForUser } from "./case-service";

export async function buildAndPersistEventAtoms(caseId: string) {
  const windows = await prisma.dateCenteredWindow.findMany({
    where: { caseId },
    orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { anchorBlockIndex: "asc" }]
  });

  if (windows.length === 0) {
    throw new ApiError("CONFLICT", "No DateCenteredWindows available for EventAtom builder", { caseId });
  }

  const atoms = buildProvisionalEventAtoms(
    windows.map((window) => ({
      id: window.id,
      caseId: window.caseId,
      dateCandidateId: window.dateCandidateId,
      sourceFileId: window.sourceFileId,
      sourcePageId: window.sourcePageId,
      canonicalDate: window.canonicalDate,
      fileOrder: window.fileOrder,
      pageOrder: window.pageOrder,
      anchorBlockIndex: window.anchorBlockIndex,
      windowStartBlockIndex: window.windowStartBlockIndex,
      windowEndBlockIndex: window.windowEndBlockIndex,
      candidateSummaryJson: window.candidateSummaryJson as never,
      createdAt: window.createdAt.toISOString()
    }))
  );

  await prisma.$transaction(async (tx) => {
    await tx.eventAtom.deleteMany({
      where: { caseId }
    });

    if (atoms.length > 0) {
      await tx.eventAtom.createMany({
        data: atoms.map((atom) => ({
          caseId: atom.caseId,
          sourceWindowId: atom.sourceWindowId,
          sourceFileId: atom.sourceFileId,
          sourcePageId: atom.sourcePageId,
          canonicalDate: atom.canonicalDate,
          fileOrder: atom.fileOrder,
          pageOrder: atom.pageOrder,
          anchorBlockIndex: atom.anchorBlockIndex,
          primaryHospital: atom.primaryHospital ?? null,
          primaryDepartment: atom.primaryDepartment ?? null,
          primaryDiagnosis: atom.primaryDiagnosis ?? null,
          primaryTest: atom.primaryTest ?? null,
          primaryTreatment: atom.primaryTreatment ?? null,
          primaryProcedure: atom.primaryProcedure ?? null,
          primarySurgery: atom.primarySurgery ?? null,
          admissionStatus: atom.admissionStatus ?? null,
          pathologySummary: atom.pathologySummary ?? null,
          medicationSummary: atom.medicationSummary ?? null,
          symptomSummary: atom.symptomSummary ?? null,
          eventTypeCandidate: atom.eventTypeCandidate,
          ambiguityScore: atom.ambiguityScore,
          requiresReview: atom.requiresReview,
          unresolvedSlotsJson: atom.unresolvedSlotsJson as Prisma.InputJsonValue,
          candidateSnapshotJson: atom.candidateSnapshotJson as Prisma.InputJsonValue
        }))
      });
    }
  });

  return {
    caseId,
    atomCount: atoms.length
  };
}

export async function listEventAtoms(caseId: string, userId: string, role: UserRole) {
  await getCaseForUser(caseId, userId, role);

  const atoms = await prisma.eventAtom.findMany({
    where: { caseId },
    orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { anchorBlockIndex: "asc" }, { createdAt: "asc" }]
  });

  return atoms.map((atom) =>
    eventAtomResponseContractSchema.parse({
      id: atom.id,
      caseId: atom.caseId,
      sourceWindowId: atom.sourceWindowId,
      sourceFileId: atom.sourceFileId,
      sourcePageId: atom.sourcePageId,
      canonicalDate: atom.canonicalDate,
      fileOrder: atom.fileOrder,
      pageOrder: atom.pageOrder,
      anchorBlockIndex: atom.anchorBlockIndex,
      primaryHospital: atom.primaryHospital,
      primaryDepartment: atom.primaryDepartment,
      primaryDiagnosis: atom.primaryDiagnosis,
      primaryTest: atom.primaryTest,
      primaryTreatment: atom.primaryTreatment,
      primaryProcedure: atom.primaryProcedure,
      primarySurgery: atom.primarySurgery,
      admissionStatus: atom.admissionStatus as "admitted" | "discharged" | "both" | null,
      pathologySummary: atom.pathologySummary,
      medicationSummary: atom.medicationSummary,
      symptomSummary: atom.symptomSummary,
      eventTypeCandidate: atom.eventTypeCandidate,
      ambiguityScore: atom.ambiguityScore,
      requiresReview: atom.requiresReview,
      unresolvedSlotsJson: atom.unresolvedSlotsJson as never,
      candidateSnapshotJson: atom.candidateSnapshotJson as never,
      createdAt: atom.createdAt.toISOString()
    })
  );
}
