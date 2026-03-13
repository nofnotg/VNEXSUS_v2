import { apiErrorEnvelopeSchema } from "@vnexus/shared";

export type CaseDocumentItem = {
  documentId: string;
  originalFileName: string;
  mimeType: string;
  pageCount: number;
  fileOrder: number;
  uploadedAt: string;
  storagePath: string;
  publicUrl?: string;
  status?: string;
};

function buildErrorMessage(json: unknown, fallback: string) {
  const parsedError = apiErrorEnvelopeSchema.safeParse(json);
  return parsedError.success ? parsedError.data.error.message : fallback;
}

export async function listCaseDocuments(caseId: string): Promise<CaseDocumentItem[]> {
  const response = await fetch(`/api/cases/${caseId}/documents`, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store"
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(buildErrorMessage(json, "Failed to load case documents"));
  }

  const items = (json as { data?: { items?: CaseDocumentItem[] } })?.data?.items;
  return Array.isArray(items) ? items : [];
}

export async function uploadCaseDocument(caseId: string, file: File) {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch(`/api/cases/${caseId}/upload`, {
    method: "POST",
    credentials: "same-origin",
    body: formData
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(buildErrorMessage(json, "Failed to upload case document"));
  }

  return (json as { data?: CaseDocumentItem })?.data;
}

export async function runCaseOcr(caseId: string, sourceDocumentIds: string[]) {
  const response = await fetch(`/api/cases/${caseId}/jobs/ocr`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sourceDocumentIds,
      enqueueReason: "manual_case_upload"
    })
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(buildErrorMessage(json, "Failed to run OCR"));
  }

  return (json as { data?: { jobId: string; status: string } })?.data;
}
