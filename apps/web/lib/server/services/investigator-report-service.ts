import { buildInvestigatorReport } from "@vnexus/domain";
import { ApiError, type UserRole } from "@vnexus/shared";
import { getInvestigatorStructuredOutput } from "./investigator-output-service";

function assertInvestigatorReportRole(role: UserRole) {
  if (role !== "investigator") {
    throw new ApiError("FORBIDDEN", "Investigator report access is restricted to investigator users");
  }
}

export async function getInvestigatorReport(caseId: string, userId: string, role: UserRole) {
  assertInvestigatorReportRole(role);
  const slotJson = await getInvestigatorStructuredOutput(caseId, userId, role);
  return buildInvestigatorReport(caseId, slotJson);
}
