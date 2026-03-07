import { ApiError, UserRole } from "@vnexus/shared";
import { loadAppEnv } from "@vnexus/shared";
import { getStorageAdapter } from "../storage/factory";
import { createDocument } from "./document-service";
import { getCaseForUser } from "./case-service";

export async function uploadDocumentFile(caseId: string, userId: string, role: UserRole, file: File) {
  await getCaseForUser(caseId, userId, role);

  const envResult = loadAppEnv();
  if (!envResult.ok) {
    throw new ApiError("NOT_READY", "Upload environment is not ready", {
      issues: envResult.issues
    });
  }

  const { UPLOAD_ALLOWED_MIME_TYPES, UPLOAD_MAX_FILE_SIZE_MB } = envResult.data;

  if (!UPLOAD_ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new ApiError("VALIDATION_ERROR", "Unsupported file type", {
      mimeType: file.type,
      allowed: UPLOAD_ALLOWED_MIME_TYPES
    });
  }

  const maxBytes = UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new ApiError("VALIDATION_ERROR", "File too large", {
      size: file.size,
      maxBytes
    });
  }

  const storage = getStorageAdapter();
  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await storage.upload({
    caseId,
    fileName: file.name,
    mimeType: file.type,
    buffer
  });

  const created = await createDocument(caseId, userId, role, {
    originalFileName: file.name,
    mimeType: file.type,
    pageCount: 1,
    storagePath: stored.storagePath
  });

  return {
    documentId: created.id,
    originalFileName: created.originalFileName,
    fileOrder: created.fileOrder,
    pageCount: created.pageCount,
    mimeType: created.mimeType,
    storagePath: created.storagePath,
    publicUrl: stored.publicUrl,
    status: "uploaded" as const
  };
}
