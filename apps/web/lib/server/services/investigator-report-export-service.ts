import { buildInvestigatorReportPdf } from "@vnexus/domain";
import { type UserRole } from "@vnexus/shared";
import { getInvestigatorNarrative } from "./investigator-narrative-service";

export async function exportInvestigatorNarrativePdf(caseId: string, userId: string, role: UserRole) {
  const narrative = await getInvestigatorNarrative(caseId, userId, role);
  const buffer = await buildInvestigatorReportPdf(narrative);

  return {
    fileName: `investigator-narrative-${caseId}.pdf`,
    mimeType: "application/pdf",
    buffer
  };
}
