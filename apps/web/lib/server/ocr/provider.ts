import vision from "@google-cloud/vision";
import { ApiError, loadAppEnv, type AppEnv } from "@vnexus/shared";
import { isMockOcrMode } from "../demo-mode";

export type OcrResultBlock = {
  text: string;
  bbox: { xMin: number; yMin: number; xMax: number; yMax: number };
  confidence: number;
};

type VisionBoundingPoly =
  | {
      vertices?: Array<{ x?: number | null; y?: number | null } | null> | null;
    }
  | null
  | undefined;

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function polygonToBox(boundingPoly: VisionBoundingPoly) {
  const vertices = boundingPoly?.vertices?.filter(Boolean) ?? [];

  if (vertices.length === 0) {
    return { xMin: 0, yMin: 0, xMax: 0, yMax: 0 };
  }

  const xs = vertices.map((vertex) => vertex?.x ?? 0);
  const ys = vertices.map((vertex) => vertex?.y ?? 0);

  return {
    xMin: Math.min(...xs),
    yMin: Math.min(...ys),
    xMax: Math.max(...xs),
    yMax: Math.max(...ys)
  };
}

function extractBlocksFromFullText(fullText: {
  pages?: Array<{
    blocks?: Array<{
      paragraphs?: Array<{
        boundingBox?: VisionBoundingPoly;
        confidence?: number | null;
        words?: Array<{
          symbols?: Array<{ text?: string | null } | null> | null;
        } | null> | null;
      } | null> | null;
    } | null> | null;
  } | null> | null;
}) {
  const blocks: OcrResultBlock[] = [];

  for (const page of fullText.pages ?? []) {
    for (const block of page?.blocks ?? []) {
      for (const paragraph of block?.paragraphs ?? []) {
        const text = normalizeText(
          (paragraph?.words ?? [])
            .map((word) =>
              (word?.symbols ?? [])
                .map((symbol) => symbol?.text ?? "")
                .join("")
            )
            .join(" ")
        );

        if (!text) {
          continue;
        }

        blocks.push({
          text,
          bbox: polygonToBox(paragraph?.boundingBox),
          confidence: paragraph?.confidence ?? 0.5
        });
      }
    }
  }

  return blocks;
}

type VisionClient = InstanceType<typeof vision.ImageAnnotatorClient>;

function buildVisionClient(env: AppEnv) {
  const keyFilename = env.GOOGLE_APPLICATION_CREDENTIALS;

  if (keyFilename && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilename;
  }

  const clientOptions: ConstructorParameters<typeof vision.ImageAnnotatorClient>[0] = {};

  if (env.GOOGLE_CLOUD_PROJECT_ID) {
    clientOptions.projectId = env.GOOGLE_CLOUD_PROJECT_ID;
  }

  if (keyFilename) {
    clientOptions.keyFilename = keyFilename;
  }

  return new vision.ImageAnnotatorClient(clientOptions);
}

async function runGoogleVisionImageOcr(client: VisionClient, fileBase64: string) {
  const [response] = await client.documentTextDetection({
    image: {
      content: Buffer.from(fileBase64, "base64")
    }
  });

  return extractBlocksFromFullText(response.fullTextAnnotation ?? {});
}

async function runGoogleVisionFileOcr(
  client: VisionClient,
  fileBase64: string,
  mimeType: string
) {
  const [response] = await client.batchAnnotateFiles({
    requests: [
      {
        inputConfig: {
          content: Buffer.from(fileBase64, "base64"),
          mimeType
        },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        pages: [1]
      }
    ]
  });

  const pageResponses = response.responses?.[0]?.responses ?? [];
  return pageResponses.flatMap((pageResponse) =>
    extractBlocksFromFullText((pageResponse.fullTextAnnotation ?? {}) as Parameters<typeof extractBlocksFromFullText>[0])
  );
}

function assertRealOcrReadiness(env: AppEnv) {
  if (!env.GOOGLE_APPLICATION_CREDENTIALS && !env.GOOGLE_CLOUD_VISION_API_KEY) {
    throw new ApiError("NOT_READY", "Google Vision credentials are not configured", {
      required: ["GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_VISION_API_KEY"],
      mode: env.OCR_MODE
    });
  }
}

export async function callOcrProvider(fileBase64: string, mimeType = "image/png"): Promise<OcrResultBlock[]> {
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

  assertRealOcrReadiness(envResult.data);

  try {
    const client = buildVisionClient(envResult.data);
    const normalizedMimeType = mimeType.toLowerCase();
    const supportsFileAnnotate =
      normalizedMimeType === "application/pdf" || normalizedMimeType === "image/tiff";

    const blocks = supportsFileAnnotate
      ? await runGoogleVisionFileOcr(client, fileBase64, normalizedMimeType)
      : await runGoogleVisionImageOcr(client, fileBase64);

    if (blocks.length === 0) {
      throw new ApiError("CONFLICT", "Google Vision returned no OCR blocks", {
        provider: envResult.data.OCR_PROVIDER,
        mimeType
      });
    }

    return blocks;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown OCR provider error";
    throw new ApiError("NOT_READY", "Google Vision OCR request failed", {
      provider: envResult.data.OCR_PROVIDER,
      mimeType,
      detail: message
    });
  }
}
