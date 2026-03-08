import { Prisma } from "@prisma/client";
import { buildProvisionalEventBundles } from "@vnexus/domain";
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

  await prisma.$transaction(async (tx) => {
    await tx.eventBundle.deleteMany({
      where: { caseId }
    });

    if (bundles.length > 0) {
      const createdBundles = await Promise.all(
        bundles.map((bundle) =>
          tx.eventBundle.create({
            data: {
              caseId: bundle.caseId,
              canonicalDate: bundle.canonicalDate,
              fileOrder: bundle.fileOrder,
              pageOrder: bundle.pageOrder,
              primaryHospital: bundle.primaryHospital ?? null,
              bundleTypeCandidate: bundle.bundleTypeCandidate,
              representativeDiagnosis: bundle.representativeDiagnosis ?? null,
              representativeTest: bundle.representativeTest ?? null,
              representativeTreatment: bundle.representativeTreatment ?? null,
              representativeProcedure: bundle.representativeProcedure ?? null,
              representativeSurgery: bundle.representativeSurgery ?? null,
              admissionStatus: bundle.admissionStatus ?? null,
              ambiguityScore: bundle.ambiguityScore,
              requiresReview: bundle.requiresReview,
              unresolvedBundleSlotsJson: bundle.unresolvedBundleSlotsJson as Prisma.InputJsonValue,
              atomIdsJson: bundle.atomIdsJson as Prisma.InputJsonValue,
              candidateSnapshotJson: bundle.candidateSnapshotJson as Prisma.InputJsonValue
            }
          })
        )
      );

      const bundleIdsByAtomId = new Map<string, string>();
      bundles.forEach((bundle, index) => {
        const bundleId = createdBundles[index]?.id;
        if (!bundleId) return;
        bundle.atomIdsJson.forEach((atomId) => {
          bundleIdsByAtomId.set(atomId, bundleId);
        });
      });

      for (const [atomId, bundleId] of bundleIdsByAtomId) {
        await tx.eventAtom.update({
          where: { id: atomId },
          data: { eventBundleId: bundleId }
        });
      }
    }
  });

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

  return bundles.map((bundle) =>
    eventBundleResponseContractSchema.parse({
      id: bundle.id,
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
      candidateSnapshotJson: bundle.candidateSnapshotJson as never,
      createdAt: bundle.createdAt.toISOString()
    })
  );
}
