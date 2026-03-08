import { buildConsumerNarrative } from "@vnexus/domain";
import { type UserRole } from "@vnexus/shared";
import { getConsumerReport } from "./consumer-report-service";

export async function getConsumerNarrative(caseId: string, userId: string, role: UserRole) {
  const report = await getConsumerReport(caseId, userId, role);
  return buildConsumerNarrative(report);
}
