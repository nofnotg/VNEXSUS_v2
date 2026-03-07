import { NextRequest } from "next/server";
import { ApiError } from "@vnexus/shared";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../../lib/server/api";
import { uploadDocumentFile } from "../../../../../lib/server/services/upload-service";

type Context = {
  params: Promise<{ caseId: string }>;
};

export async function POST(request: NextRequest, context: Context) {
  try {
    const { caseId } = await context.params;
    const { user } = await requireAuthorizedSession();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ApiError("VALIDATION_ERROR", "file field is required");
    }

    const uploaded = await uploadDocumentFile(caseId, user.id, user.role, file);
    return apiSuccess(uploaded, { status: 201 });
  } catch (error) {
    return apiFailure(error);
  }
}
