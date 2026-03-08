import { buildInvestigatorReport } from "@vnexus/domain";
import { type UserRole } from "@vnexus/shared";
import { getInvestigatorStructuredOutput } from "./investigator-output-service";

export async function getInvestigatorReport(caseId: string, userId: string, role: UserRole) {
  const slotJson = await getInvestigatorStructuredOutput(caseId, userId, role);
  return buildInvestigatorReport(caseId, slotJson);
}
