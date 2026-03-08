import { buildConsumerReport } from "@vnexus/domain";
import { type UserRole } from "@vnexus/shared";
import { getConsumerStructuredOutput } from "./consumer-output-service";

export async function getConsumerReport(caseId: string, userId: string, role: UserRole) {
  const summaryJson = await getConsumerStructuredOutput(caseId, userId, role);
  return buildConsumerReport(caseId, summaryJson);
}
