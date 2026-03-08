import { NextRequest } from "next/server";
import { ApiError } from "@vnexus/shared";
import { apiFailure, requireAuthorizedSession } from "../../../../../../../../lib/server/api";
import { resolveReportLocale } from "../../../../../../../../lib/server/report-locale";
import { exportInvestigatorNarrativePdf } from "../../../../../../../../lib/server/services/investigator-report-export-service";

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

    const exported = await exportInvestigatorNarrativePdf(caseId, user.id, user.role, lang);
    const bodyBytes = new Uint8Array(exported.buffer);
    const body = new Blob([bodyBytes], { type: exported.mimeType });

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": exported.mimeType,
        "Content-Disposition": `attachment; filename="${exported.fileName}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return apiFailure(error);
  }
}
