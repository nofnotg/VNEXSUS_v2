import { Prisma } from "@prisma/client";
import { applyBundleQualityInvariant, buildProvisionalEventBundles } from "@vnexus/domain";
import { ApiError, eventBundleResponseContractSchema, type UserRole } from "@vnexus/shared";
import { prisma } from "../../prisma";
import { getCaseForUser } from "./case-service";

export async function buildAndPersistEventBundles(caseId: string) {
  const atoms = await prisma.eventAtom.findMany({
    where: { caseId },
    orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { canonicalDate: "asc" }, { anchorBlockIndex: "asc" }]
  });

  if (atoms.length === 0) {
    throw new ApiError("CONFLICT", "No EventAtoms available for EventBundle builder", { caseId });
  }

  const bundles = buildProvisionalEventBundles(
    atoms.map((atom) => ({
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
    }))
  );

  // Keep the reset transaction tiny, then persist each bundle in a bounded write step.
  await prisma.$transaction(async (tx) => {
    await tx.eventAtom.updateMany({
      where: { caseId },
      data: { eventBundleId: null }
    });

    await tx.eventBundle.deleteMany({
      where: { caseId }
    });
  });

  for (const bundle of bundles) {
    const normalizedBundle = applyBundleQualityInvariant(bundle);

    await prisma.$transaction(
      async (tx) => {
        const createdBundle = await tx.eventBundle.create({
          data: {
            caseId: normalizedBundle.caseId,
            canonicalDate: normalizedBundle.canonicalDate,
            fileOrder: normalizedBundle.fileOrder,
            pageOrder: normalizedBundle.pageOrder,
            primaryHospital: normalizedBundle.primaryHospital ?? null,
            bundleTypeCandidate: normalizedBundle.bundleTypeCandidate,
            representativeDiagnosis: normalizedBundle.representativeDiagnosis ?? null,
            representativeTest: normalizedBundle.representativeTest ?? null,
            representativeTreatment: normalizedBundle.representativeTreatment ?? null,
            representativeProcedure: normalizedBundle.representativeProcedure ?? null,
            representativeSurgery: normalizedBundle.representativeSurgery ?? null,
            admissionStatus: normalizedBundle.admissionStatus ?? null,
            ambiguityScore: normalizedBundle.ambiguityScore,
            requiresReview: normalizedBundle.requiresReview,
            unresolvedBundleSlotsJson: normalizedBundle.unresolvedBundleSlotsJson as Prisma.InputJsonValue,
            atomIdsJson: normalizedBundle.atomIdsJson as Prisma.InputJsonValue,
            candidateSnapshotJson: normalizedBundle.candidateSnapshotJson as Prisma.InputJsonValue
          }
        });

        await tx.eventAtom.updateMany({
          where: {
            caseId,
            id: { in: normalizedBundle.atomIdsJson }
          },
          data: { eventBundleId: createdBundle.id }
        });
      },
      { timeout: 15_000 }
    );
  }

  return {
    caseId,
    bundleCount: bundles.length
  };
}

export async function listEventBundles(caseId: string, userId: string, role: UserRole) {
  await getCaseForUser(caseId, userId, role);

  const bundles = await prisma.eventBundle.findMany({
    where: { caseId },
    orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { canonicalDate: "asc" }, { createdAt: "asc" }]
  });

  return bundles.map((bundle) => {
    const normalizedBundle = applyBundleQualityInvariant({
      caseId: bundle.caseId,
      canonicalDate: bundle.canonicalDate,
      fileOrder: bundle.fileOrder,
      pageOrder: bundle.pageOrder,
      primaryHospital: bundle.primaryHospital,
      bundleTypeCandidate: bundle.bundleTypeCandidate,
      representativeDiagnosis: bundle.representativeDiagnosis,
      representativeTest: bundle.representativeTest,
      representativeTreatment: bundle.representativeTreatment,
      representativeProcedure: bundle.representativeProcedure,
      representativeSurgery: bundle.representativeSurgery,
      admissionStatus: bundle.admissionStatus as "admitted" | "discharged" | "both" | null,
      ambiguityScore: bundle.ambiguityScore,
      requiresReview: bundle.requiresReview,
      unresolvedBundleSlotsJson: bundle.unresolvedBundleSlotsJson as never,
      atomIdsJson: bundle.atomIdsJson as string[],
      candidateSnapshotJson: bundle.candidateSnapshotJson as never
    });

    return eventBundleResponseContractSchema.parse({
      id: bundle.id,
      caseId: normalizedBundle.caseId,
      canonicalDate: normalizedBundle.canonicalDate,
      fileOrder: normalizedBundle.fileOrder,
      pageOrder: normalizedBundle.pageOrder,
      primaryHospital: normalizedBundle.primaryHospital,
      bundleTypeCandidate: normalizedBundle.bundleTypeCandidate,
      representativeDiagnosis: normalizedBundle.representativeDiagnosis,
      representativeTest: normalizedBundle.representativeTest,
      representativeTreatment: normalizedBundle.representativeTreatment,
      representativeProcedure: normalizedBundle.representativeProcedure,
      representativeSurgery: normalizedBundle.representativeSurgery,
      admissionStatus: normalizedBundle.admissionStatus,
      ambiguityScore: normalizedBundle.ambiguityScore,
      requiresReview: normalizedBundle.requiresReview,
      unresolvedBundleSlotsJson: normalizedBundle.unresolvedBundleSlotsJson as never,
      atomIdsJson: normalizedBundle.atomIdsJson as string[],
      candidateSnapshotJson: normalizedBundle.candidateSnapshotJson as never,
      createdAt: bundle.createdAt.toISOString()
    });
  });
}
