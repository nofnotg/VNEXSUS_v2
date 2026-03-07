import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { loadAppEnv, ApiError } from "@vnexus/shared";
import type { StorageAdapter, StoredObject } from "./types";

const STORAGE_ROOT = path.join(process.cwd(), ".storage");

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function buildPublicUrl(baseUrl: string | undefined, storagePath: string) {
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(storagePath)}`;
  }

  return storagePath;
}

function createMirrorAdapter(driver: "gcs" | "supabase", bucket: string, publicBaseUrl?: string): StorageAdapter {
  return {
    async upload({ caseId, fileName, buffer }): Promise<StoredObject> {
      const objectKey = `${caseId}/${randomUUID()}-${sanitizeFileName(fileName)}`;
      const storagePath = `${driver}://${bucket}/${objectKey}`;
      const diskPath = path.join(STORAGE_ROOT, driver, bucket, objectKey);

      await mkdir(path.dirname(diskPath), { recursive: true });
      await writeFile(diskPath, buffer);

      return {
        storagePath,
        publicUrl: buildPublicUrl(publicBaseUrl, storagePath)
      };
    },

    async readAsBase64(storagePath: string) {
      const prefix = `${driver}://${bucket}/`;
      if (!storagePath.startsWith(prefix)) {
        throw new ApiError("CONFLICT", "storagePath does not match configured storage driver/bucket", {
          storagePath,
          expectedPrefix: prefix
        });
      }

      const objectKey = storagePath.slice(prefix.length);
      const diskPath = path.join(STORAGE_ROOT, driver, bucket, objectKey);
      const file = await readFile(diskPath);
      return file.toString("base64");
    }
  };
}

export function getStorageAdapter(): StorageAdapter {
  const envResult = loadAppEnv();
  if (!envResult.ok) {
    throw new ApiError("NOT_READY", "Storage environment is not ready", {
      issues: envResult.issues
    });
  }

  const {
    data: { STORAGE_DRIVER, STORAGE_BUCKET, STORAGE_PUBLIC_BASE_URL }
  } = envResult;

  // TODO(storage): replace local mirror skeleton with real GCS / Supabase SDK adapters.
  return createMirrorAdapter(STORAGE_DRIVER, STORAGE_BUCKET, STORAGE_PUBLIC_BASE_URL);
}
