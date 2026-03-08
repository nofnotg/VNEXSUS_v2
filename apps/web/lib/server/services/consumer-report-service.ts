import { buildConsumerReport } from "@vnexus/domain";
import { ApiError, type UserRole } from "@vnexus/shared";
import { getConsumerStructuredOutput } from "./consumer-output-service";

function assertConsumerReportRole(role: UserRole) {
  if (role !== "consumer") {
    throw new ApiError("FORBIDDEN", "Consumer report access is restricted to consumer users");
  }
}

export async function getConsumerReport(caseId: string, userId: string, role: UserRole) {
  assertConsumerReportRole(role);
  const summaryJson = await getConsumerStructuredOutput(caseId, userId, role);
  return buildConsumerReport(caseId, summaryJson);
}
