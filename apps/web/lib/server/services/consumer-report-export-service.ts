import { buildConsumerReportPdf } from "@vnexus/domain";
import { type LocaleCode, type UserRole } from "@vnexus/shared";
import { getConsumerNarrative } from "./consumer-narrative-service";

export async function exportConsumerNarrativePdf(
  caseId: string,
  userId: string,
  role: UserRole,
  lang: LocaleCode = "en"
) {
  const narrative = await getConsumerNarrative(caseId, userId, role, lang);
  const buffer = await buildConsumerReportPdf(narrative, lang);

  return {
    fileName: `consumer-narrative-${caseId}.pdf`,
    mimeType: "application/pdf",
    buffer
  };
}
