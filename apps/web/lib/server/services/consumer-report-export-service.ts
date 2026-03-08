import { buildConsumerReportPdf } from "@vnexus/domain";
import { type UserRole } from "@vnexus/shared";
import { getConsumerNarrative } from "./consumer-narrative-service";

export async function exportConsumerNarrativePdf(caseId: string, userId: string, role: UserRole) {
  const narrative = await getConsumerNarrative(caseId, userId, role);
  const buffer = await buildConsumerReportPdf(narrative);

  return {
    fileName: `consumer-narrative-${caseId}.pdf`,
    mimeType: "application/pdf",
    buffer
  };
}
