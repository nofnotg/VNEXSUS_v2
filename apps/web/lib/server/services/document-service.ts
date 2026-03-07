import { ApiError, DocumentCreateInput, UserRole } from "@vnexus/shared";
import { prisma } from "../../prisma";
import { getCaseForUser } from "./case-service";

export async function listDocuments(caseId: string, userId: string, role: UserRole) {
  await getCaseForUser(caseId, userId, role);

  return prisma.sourceDocument.findMany({
    where: { caseId },
    orderBy: { fileOrder: "asc" },
    include: {
      pages: {
        orderBy: { pageOrder: "asc" }
      }
    }
  });
}

export async function createDocument(caseId: string, userId: string, role: UserRole, input: DocumentCreateInput) {
  await getCaseForUser(caseId, userId, role);

  const nextFileOrder =
    (await prisma.sourceDocument.aggregate({
      where: { caseId },
      _max: { fileOrder: true }
    }))._max.fileOrder ?? 0;

  return prisma.$transaction(async (tx) => {
    const document = await tx.sourceDocument.create({
      data: {
        caseId,
        originalFileName: input.originalFileName,
        fileOrder: nextFileOrder + 1,
        pageCount: input.pageCount,
        mimeType: input.mimeType,
        storagePath:
          input.storagePath ??
          `cases/${caseId}/documents/${crypto.randomUUID()}-${input.originalFileName.replace(/\s+/g, "-")}`
      }
    });

    if (input.pageCount > 0) {
      await tx.sourcePage.createMany({
        data: Array.from({ length: input.pageCount }, (_, index) => ({
          sourceFileId: document.id,
          pageOrder: index + 1
        }))
      });
    }

    return document;
  });
}

export async function deleteDocument(documentId: string, userId: string, role: UserRole) {
  const document = await prisma.sourceDocument.findFirst({
    where:
      role === "admin"
        ? { id: documentId }
        : {
            id: documentId,
            case: {
              ownerUserId: userId
            }
          }
  });

  if (!document) {
    throw new ApiError("NOT_FOUND", "Document not found");
  }

  await prisma.sourceDocument.delete({
    where: { id: documentId }
  });

  return {
    deleted: true,
    documentId
  };
}
