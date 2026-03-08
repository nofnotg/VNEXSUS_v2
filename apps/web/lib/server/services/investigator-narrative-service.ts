import { buildInvestigatorNarrative } from "@vnexus/domain";
import { type LocaleCode, type UserRole } from "@vnexus/shared";
import { getInvestigatorReport } from "./investigator-report-service";

export async function getInvestigatorNarrative(caseId: string, userId: string, role: UserRole, lang: LocaleCode = "en") {
  const report = await getInvestigatorReport(caseId, userId, role);
  return buildInvestigatorNarrative(report, lang);
}
