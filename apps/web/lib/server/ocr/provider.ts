import vision from "@google-cloud/vision";
import { Storage } from "@google-cloud/storage";
import { ApiError, loadAppEnv, type AppEnv } from "@vnexus/shared";
import { isMockOcrMode } from "../demo-mode";

export type OcrResultBlock = {
  text: string;
  bbox: { xMin: number; yMin: number; xMax: number; yMax: number };
  confidence: number;
  pageOrder: number;
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
}, pageOrder = 1) {
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
          confidence: paragraph?.confidence ?? 0.5,
          pageOrder
        });
      }
    }
  }

  return blocks;
}

type VisionClient = InstanceType<typeof vision.ImageAnnotatorClient>;
type StorageClient = InstanceType<typeof Storage>;

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

function buildStorageClient(env: AppEnv) {
  const keyFilename = env.GOOGLE_APPLICATION_CREDENTIALS;
  const clientOptions: ConstructorParameters<typeof Storage>[0] = {};

  if (env.GOOGLE_CLOUD_PROJECT_ID) {
    clientOptions.projectId = env.GOOGLE_CLOUD_PROJECT_ID;
  }

  if (keyFilename) {
    clientOptions.keyFilename = keyFilename;
  }

  return new Storage(clientOptions);
}

function parseGcsUri(gcsUri: string) {
  const match = /^gcs:\/\/([^/]+)\/(.+)$/.exec(gcsUri);
  if (!match) {
    throw new ApiError("CONFLICT", "Expected gcs:// storagePath for file OCR", { storagePath: gcsUri });
  }

  return {
    bucketName: match[1]!,
    objectName: match[2]!
  };
}

async function runGoogleVisionImageOcr(client: VisionClient, fileBase64: string) {
  const [response] = await client.documentTextDetection({
    image: {
      content: Buffer.from(fileBase64, "base64")
    }
  });

  return extractBlocksFromFullText(response.fullTextAnnotation ?? {}, 1);
}

async function runGoogleVisionFileOcr(
  client: VisionClient,
  storageClient: StorageClient,
  fileBase64: string,
  mimeType: string,
  storagePath: string
) {
  const { bucketName, objectName } = parseGcsUri(storagePath);
  const bucket = storageClient.bucket(bucketName);
  const inputFile = bucket.file(objectName);
  const inputBytes = Buffer.from(fileBase64, "base64");
  await inputFile.save(inputBytes, {
    resumable: false,
    contentType: mimeType
  });

  const outputPrefix = `ocr-output/${objectName.replace(/[\\/]/g, "-")}-${Date.now()}/`;
  const outputUri = `gs://${bucketName}/${outputPrefix}`;

  const [operation] = await client.asyncBatchAnnotateFiles({
    requests: [
      {
        inputConfig: {
          gcsSource: {
            uri: `gs://${bucketName}/${objectName}`
          },
          mimeType: mimeType
        },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        outputConfig: {
          gcsDestination: {
            uri: outputUri
          },
          batchSize: 20
        }
      }
    ]
  });

  await operation.promise();

  const [files] = await bucket.getFiles({ prefix: outputPrefix });
  const jsonFiles = files
    .map((file) => file.name)
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .sort((a, b) => a.localeCompare(b));

  const blocks: OcrResultBlock[] = [];
  let pageOrder = 1;

  for (const fileName of jsonFiles) {
    const [jsonBuffer] = await bucket.file(fileName).download();
    const payload = JSON.parse(jsonBuffer.toString("utf8")) as {
      responses?: Array<{ fullTextAnnotation?: Parameters<typeof extractBlocksFromFullText>[0] | null }>;
    };

    for (const pageResponse of payload.responses ?? []) {
      blocks.push(
        ...extractBlocksFromFullText((pageResponse.fullTextAnnotation ?? {}) as Parameters<typeof extractBlocksFromFullText>[0], pageOrder)
      );
      pageOrder += 1;
    }
  }

  return blocks;
}

function assertRealOcrReadiness(env: AppEnv) {
  if (!env.GOOGLE_APPLICATION_CREDENTIALS && !env.GOOGLE_CLOUD_VISION_API_KEY) {
    throw new ApiError("NOT_READY", "Google Vision credentials are not configured", {
      required: ["GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_VISION_API_KEY"],
      mode: env.OCR_MODE
    });
  }
}

export async function callOcrProvider(
  fileBase64: string,
  input: { mimeType?: string; storagePath?: string } = {}
): Promise<OcrResultBlock[]> {
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
        confidence: 0.99,
        pageOrder: 1
      },
      {
        text: "2024-03-21 VNEXUS Demo Medical Center CT exam inflammatory change follow-up review",
        bbox: { xMin: 0, yMin: 28, xMax: 120, yMax: 56 },
        confidence: 0.97,
        pageOrder: 1
      }
    ];
  }

  assertRealOcrReadiness(envResult.data);
  const normalizedMimeType = (input.mimeType ?? "image/png").toLowerCase();

  try {
    const client = buildVisionClient(envResult.data);
    const storageClient = buildStorageClient(envResult.data);
    const supportsFileAnnotate =
      normalizedMimeType === "application/pdf" || normalizedMimeType === "image/tiff";

    const blocks = supportsFileAnnotate
      ? await runGoogleVisionFileOcr(client, storageClient, fileBase64, normalizedMimeType, input.storagePath ?? "")
      : await runGoogleVisionImageOcr(client, fileBase64);

    if (blocks.length === 0) {
      throw new ApiError("CONFLICT", "Google Vision returned no OCR blocks", {
        provider: envResult.data.OCR_PROVIDER,
        mimeType: normalizedMimeType
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
      mimeType: normalizedMimeType,
      detail: message
    });
  }
}
