import { buildConsumerStructuredOutput } from "@vnexus/domain";
import { type UserRole } from "@vnexus/shared";
import { prisma } from "../../prisma";
import { getCaseForUser } from "./case-service";

export async function getConsumerStructuredOutput(caseId: string, userId: string, role: UserRole) {
  await getCaseForUser(caseId, userId, role);

  const bundles = await prisma.eventBundle.findMany({
    where: { caseId },
    orderBy: [{ canonicalDate: "asc" }, { fileOrder: "asc" }, { pageOrder: "asc" }, { createdAt: "asc" }]
  });

  return buildConsumerStructuredOutput(
    caseId,
    bundles.map((bundle) => ({
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
    }))
  );
}
