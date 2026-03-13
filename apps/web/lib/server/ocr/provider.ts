import { loadAppEnv, ApiError } from "@vnexus/shared";
import { isMockOcrMode } from "../demo-mode";

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

  if (isMockOcrMode()) {
    return [
      {
        text: "2024-03-14 VNEXUS Demo Medical Center abdominal pain outpatient visit",
        bbox: { xMin: 0, yMin: 0, xMax: 100, yMax: 24 },
        confidence: 0.99
      },
      {
        text: "2024-03-21 VNEXUS Demo Medical Center CT exam inflammatory change follow-up review",
        bbox: { xMin: 0, yMin: 28, xMax: 120, yMax: 56 },
        confidence: 0.97
      }
    ];
  }

  // TODO(ocr): replace skeleton call with real Google Cloud Vision adapter.
  console.log("[ocr-provider] skeleton invocation", {
    provider: envResult.data.OCR_PROVIDER,
    base64Length: imageBase64.length
  });

  return [];
}
