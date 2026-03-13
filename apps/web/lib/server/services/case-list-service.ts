import { ApiError, caseListJsonSchema, type UserRole } from "@vnexus/shared";
import { caseListRepository, type CaseListRecord } from "../data-access/case-list-repository";
import { isLocalDemoMode } from "../demo-mode";
import { listDemoCases } from "../demo-store";

function mapCaseListItem(item: CaseListRecord) {
  const readyReport = item.reports.find((report) => report.status === "ready");
  const hasNarrative = Boolean(readyReport);

  return {
    caseId: item.id,
    hospitalName: item.eventBundles[0]?.primaryHospital ?? item.patientInput?.insuranceCompany ?? null,
    uploadDate: item.sourceDocuments[0]?.uploadedAt.toISOString() ?? item.createdAt.toISOString(),
    status: item.status,
    audience: item.audience,
    hasReport: Boolean(readyReport),
    hasNarrative,
    hasPdf: hasNarrative
  };
}

export async function getCaseList(
  userId: string,
  role: UserRole,
  repository: Pick<typeof caseListRepository, "findCasesForUser"> = caseListRepository
) {
  if (!["consumer", "investigator", "admin"].includes(role)) {
    throw new ApiError("FORBIDDEN", "This role cannot access case list");
  }

  if (isLocalDemoMode()) {
    return listDemoCases();
  }

  const items = await repository.findCasesForUser(userId, role === "admin");

  return caseListJsonSchema.parse({
    items: items.map(mapCaseListItem)
  });
}
