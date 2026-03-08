import { buildInvestigatorReportPdf } from "@vnexus/domain";
import { type LocaleCode, type UserRole } from "@vnexus/shared";
import { getInvestigatorNarrative } from "./investigator-narrative-service";

export async function exportInvestigatorNarrativePdf(
  caseId: string,
  userId: string,
  role: UserRole,
  lang: LocaleCode = "en"
) {
  const narrative = await getInvestigatorNarrative(caseId, userId, role, lang);
  const buffer = await buildInvestigatorReportPdf(narrative, lang);

  return {
    fileName: `investigator-narrative-${caseId}.pdf`,
    mimeType: "application/pdf",
    buffer
  };
}
