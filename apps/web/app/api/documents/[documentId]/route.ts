import { NextRequest } from "next/server";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../lib/server/api";
import { deleteDocument } from "../../../../lib/server/services/document-service";

type Context = {
  params: Promise<{ documentId: string }>;
};

export async function DELETE(_: NextRequest, context: Context) {
  try {
    const { documentId } = await context.params;
    const { user } = await requireAuthorizedSession();
    const result = await deleteDocument(documentId, user.id, user.role);
    return apiSuccess(result);
  } catch (error) {
    return apiFailure(error);
  }
}
