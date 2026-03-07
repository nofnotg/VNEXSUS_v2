import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const uploadSpy = vi.fn();

vi.mock("../../../../../lib/server/api", () => ({
  requireAuthorizedSession: vi.fn(async () => ({
    user: { id: "user-1", role: "consumer" }
  })),
  apiSuccess: vi.fn((data: unknown, init?: ResponseInit) => Response.json({ success: true, data }, init)),
  apiFailure: vi.fn((error: unknown) => Response.json({ success: false, error: String(error) }, { status: 400 }))
}));

vi.mock("../../../../../lib/server/services/upload-service", () => ({
  uploadDocumentFile: vi.fn(async (...args: unknown[]) => {
    uploadSpy(...args);
    return {
      documentId: "doc-1",
      storagePath: "gcs://vnexus-v2-documents/case-1/input.pdf",
      publicUrl: "http://localhost:3000/storage/case-1/input.pdf",
      fileOrder: 1,
      pageCount: 1,
      mimeType: "application/pdf",
      originalFileName: "input.pdf",
      status: "uploaded"
    };
  })
}));

import { POST } from "./route";

describe("upload route", () => {
  it("accepts multipart/form-data and forwards File to upload service", async () => {
    const formData = new FormData();
    formData.set("file", new File([new Uint8Array([1, 2, 3])], "input.pdf", { type: "application/pdf" }));
    const request = new Request("http://localhost/api/cases/case-1/upload", {
      method: "POST",
      body: formData
    }) as NextRequest;

    const response = await POST(request, {
      params: Promise.resolve({ caseId: "case-1" })
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(uploadSpy).toHaveBeenCalledTimes(1);
  });
});
