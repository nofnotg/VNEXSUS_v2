import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserRole } from "@vnexus/shared";

const state = vi.hoisted(() => ({
  uploaded: null as null | { caseId: string; fileName: string; mimeType: string; size: number },
  createdDocuments: [] as Array<{ storagePath: string; fileOrder: number }>,
  env: {
    STORAGE_DRIVER: "gcs",
    STORAGE_BUCKET: "vnexus-v2-documents",
    STORAGE_PUBLIC_BASE_URL: "http://localhost:3000/storage",
    UPLOAD_ALLOWED_MIME_TYPES: ["application/pdf"],
    UPLOAD_MAX_FILE_SIZE_MB: 20
  }
}));

vi.mock("@vnexus/shared", async () => {
  const actual = await vi.importActual<object>("@vnexus/shared");
  return {
    ...actual,
    loadAppEnv: vi.fn(() => ({ ok: true, data: { ...state.env } }))
  };
});

vi.mock("../storage/factory", () => ({
  getStorageAdapter: vi.fn(() => ({
    upload: vi.fn(async ({ caseId, fileName, mimeType, buffer }: { caseId: string; fileName: string; mimeType: string; buffer: Buffer }) => {
      state.uploaded = { caseId, fileName, mimeType, size: buffer.length };
      return {
        storagePath: `gcs://vnexus-v2-documents/${caseId}/${fileName}`,
        publicUrl: `http://localhost:3000/storage/${caseId}/${fileName}`
      };
    })
  }))
}));

vi.mock("./document-service", () => ({
  createDocument: vi.fn(async (_caseId: string, _userId: string, _role: UserRole, input: { storagePath: string }) => {
    const created = {
      id: `doc-${state.createdDocuments.length + 1}`,
      originalFileName: "input.pdf",
      fileOrder: state.createdDocuments.length + 1,
      pageCount: 1,
      mimeType: "application/pdf",
      storagePath: input.storagePath
    };
    state.createdDocuments.push({ storagePath: created.storagePath, fileOrder: created.fileOrder });
    return created;
  })
}));

vi.mock("./case-service", () => ({
  getCaseForUser: vi.fn(async () => ({ id: "case-1" }))
}));

import { uploadDocumentFile } from "./upload-service";

describe("upload document skeleton", () => {
  beforeEach(() => {
    state.uploaded = null;
    state.createdDocuments = [];
  });

  it("calls storage adapter and stores storagePath/fileOrder", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "input.pdf", { type: "application/pdf" });

    const result = await uploadDocumentFile("case-1", "user-1", "consumer" as UserRole, file);

    expect(state.uploaded).toEqual({
      caseId: "case-1",
      fileName: "input.pdf",
      mimeType: "application/pdf",
      size: 3
    });
    expect(result.storagePath).toContain("gcs://vnexus-v2-documents/case-1/input.pdf");
    expect(result.fileOrder).toBe(1);
  });
});
