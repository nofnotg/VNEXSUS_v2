import { NextRequest } from "next/server";
import { documentCreateContract } from "@vnexus/domain";
import { apiFailure, apiSuccess, parseJsonBody, requireAuthorizedSession } from "../../../../../lib/server/api";
import { createDocument, listDocuments } from "../../../../../lib/server/services/document-service";

type Context = {
  params: Promise<{ caseId: string }>;
};

export async function GET(_: NextRequest, context: Context) {
  try {
    const { caseId } = await context.params;
    const { user } = await requireAuthorizedSession();
    const items = await listDocuments(caseId, user.id, user.role);
    return apiSuccess({ items });
  } catch (error) {
    return apiFailure(error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { caseId } = await context.params;
    const { user } = await requireAuthorizedSession();
    const input = await parseJsonBody(request, documentCreateContract);
    const created = await createDocument(caseId, user.id, user.role, input);
    return apiSuccess(
      {
        documentId: created.id,
        fileOrder: created.fileOrder,
        status: "uploaded"
      },
      { status: 201 }
    );
  } catch (error) {
    return apiFailure(error);
  }
}
