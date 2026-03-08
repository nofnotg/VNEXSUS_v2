import { ApiError, caseListJsonSchema, type CaseListItem, type UserRole } from "@vnexus/shared";

const mockCaseItems: Array<CaseListItem & { ownerUserId: string }> = [
  {
    caseId: "case-1",
    ownerUserId: "user-1",
    uploadDate: "2026-03-06T09:00:00.000Z",
    status: "ready",
    audience: "investigator"
  },
  {
    caseId: "case-2",
    ownerUserId: "user-1",
    uploadDate: "2026-03-07T14:30:00.000Z",
    status: "review_required",
    audience: "consumer"
  },
  {
    caseId: "case-3",
    ownerUserId: "user-2",
    uploadDate: "2026-03-08T08:15:00.000Z",
    status: "processing",
    audience: "consumer"
  }
];

export async function getCaseList(userId: string, role: UserRole) {
  if (!["consumer", "investigator", "admin"].includes(role)) {
    throw new ApiError("FORBIDDEN", "This role cannot access case list");
  }

  const items = role === "admin" ? mockCaseItems : mockCaseItems.filter((item) => item.ownerUserId === userId);

  return caseListJsonSchema.parse({
    items: items.map(({ ownerUserId: _ownerUserId, ...item }) => item)
  });
}
