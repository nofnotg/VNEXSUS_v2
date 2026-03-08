import { buildInvestigatorNarrative } from "@vnexus/domain";
import { type UserRole } from "@vnexus/shared";
import { getInvestigatorReport } from "./investigator-report-service";

export async function getInvestigatorNarrative(caseId: string, userId: string, role: UserRole) {
  const report = await getInvestigatorReport(caseId, userId, role);
  return buildInvestigatorNarrative(report);
}
