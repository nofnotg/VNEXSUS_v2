import { NextRequest } from "next/server";
import { apiFailure, apiSuccess, requireAuthorizedSession } from "../../../../../lib/server/api";
import { listEvidenceForBundle } from "../../../../../lib/server/services/evidence-service";

type Context = {
  params: Promise<{ bundleId: string }>;
};

export async function GET(_: NextRequest, context: Context) {
  try {
    // Epic 1 placeholder only. EventBundle creation/linking is intentionally
    // deferred until the extraction phase; this route keeps the contract shape
    // without making EventBundle a first-class ingestion concern yet.
    const { bundleId } = await context.params;
    const { user } = await requireAuthorizedSession();
    const evidence = await listEvidenceForBundle(bundleId, user.id, user.role);
    return apiSuccess(evidence);
  } catch (error) {
    return apiFailure(error);
  }
}
