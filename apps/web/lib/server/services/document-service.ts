import { ApiError, DocumentCreateInput, UserRole } from "@vnexus/shared";
import { assertContiguousFileOrders, assertContiguousPageOrders } from "@vnexus/domain";
import { prisma } from "../../prisma";
import { getCaseForUser } from "./case-service";
import { isLocalDemoMode } from "../demo-mode";
import { listDemoDocuments } from "../demo-store";

export async function listDocuments(caseId: string, userId: string, role: UserRole) {
  if (isLocalDemoMode()) {
    return listDemoDocuments(caseId);
  }

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

  const existingDocuments = await prisma.sourceDocument.findMany({
    where: { caseId },
    orderBy: { fileOrder: "asc" }
  });

  assertContiguousFileOrders(existingDocuments);

  const nextFileOrder = (existingDocuments.at(-1)?.fileOrder ?? 0) + 1;

  return prisma.$transaction(async (tx) => {
    const document = await tx.sourceDocument.create({
      data: {
        caseId,
        originalFileName: input.originalFileName,
        fileOrder: nextFileOrder,
        pageCount: input.pageCount,
        mimeType: input.mimeType,
        storagePath:
          input.storagePath ??
          `cases/${caseId}/documents/${crypto.randomUUID()}-${input.originalFileName.replace(/\s+/g, "-")}`
      }
    });

    if (input.pageCount > 0) {
      const pages = Array.from({ length: input.pageCount }, (_, index) => ({
        sourceFileId: document.id,
        pageOrder: index + 1
      }));

      assertContiguousPageOrders(pages);

      await tx.sourcePage.createMany({
        data: pages
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

  await prisma.$transaction(async (tx) => {
    await tx.sourceDocument.delete({
      where: { id: documentId }
    });

    const remainingDocuments = await tx.sourceDocument.findMany({
      where: { caseId: document.caseId },
      orderBy: { fileOrder: "asc" }
    });

    for (const [index, item] of remainingDocuments.entries()) {
      const nextFileOrder = index + 1;
      if (item.fileOrder !== nextFileOrder) {
        await tx.sourceDocument.update({
          where: { id: item.id },
          data: { fileOrder: nextFileOrder }
        });
      }
    }
  });

  return {
    deleted: true,
    documentId
  };
}

export async function createDocumentForTesting(caseId: string, fileOrder: number, pageCount: number) {
  return prisma.$transaction(async (tx) => {
    const document = await tx.sourceDocument.create({
      data: {
        caseId,
        originalFileName: `file-${fileOrder}.pdf`,
        fileOrder,
        pageCount,
        mimeType: "application/pdf",
        storagePath: `cases/${caseId}/documents/file-${fileOrder}.pdf`
      }
    });

    await tx.sourcePage.createMany({
      data: Array.from({ length: pageCount }, (_, index) => ({
        sourceFileId: document.id,
        pageOrder: index + 1
      }))
    });

    return document;
  });
}
