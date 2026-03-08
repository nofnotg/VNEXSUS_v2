import { NextRequest } from "next/server";
import { ApiError } from "@vnexus/shared";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../../../../lib/server/api";
import { resolveReportLocale } from "../../../../../../../lib/server/report-locale";
import { getInvestigatorNarrative } from "../../../../../../../lib/server/services/investigator-narrative-service";

type Context = {
  params: Promise<{ caseId: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  try {
    const { caseId } = await context.params;
    const { user } = await requireAuthorizedSession();
    const lang = resolveReportLocale(
      request.nextUrl.searchParams.get("lang"),
      request.cookies.get("vnexus_lang")?.value,
      request.headers.get("accept-language")
    );

    if (user.role !== "investigator") {
      throw new ApiError("FORBIDDEN", "Investigator role is required");
    }

    const narrative = await getInvestigatorNarrative(caseId, user.id, user.role, lang);
    return apiSuccess(narrative);
  } catch (error) {
    return apiFailure(error);
  }
}
