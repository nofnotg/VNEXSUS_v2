import { loadAppEnv, ApiError } from "@vnexus/shared";

export type OcrResultBlock = {
  text: string;
  bbox: { xMin: number; yMin: number; xMax: number; yMax: number };
  confidence: number;
};

export async function callOcrProvider(imageBase64: string): Promise<OcrResultBlock[]> {
  const envResult = loadAppEnv();
  if (!envResult.ok) {
    throw new ApiError("NOT_READY", "OCR environment is not ready", {
      issues: envResult.issues
    });
  }

  // TODO(ocr): replace skeleton call with real Google Cloud Vision adapter.
  console.log("[ocr-provider] skeleton invocation", {
    provider: envResult.data.OCR_PROVIDER,
    base64Length: imageBase64.length
  });

  return [];
}
