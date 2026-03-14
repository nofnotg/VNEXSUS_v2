import { envSchema, type AppEnv } from "./schema";

export function loadAppEnv(source: NodeJS.ProcessEnv = process.env):
  | { ok: true; data: AppEnv }
  | { ok: false; issues: string[] } {
  const normalizedSource: NodeJS.ProcessEnv = {
    ...source,
    APP_BASE_URL: source.APP_BASE_URL ?? source.APP_URL,
    GOOGLE_CLOUD_PROJECT_ID: source.GOOGLE_CLOUD_PROJECT_ID ?? source.GCP_PROJECT_ID,
    STORAGE_BUCKET: source.STORAGE_BUCKET ?? source.GCS_BUCKET_NAME
  };

  const parsed = envSchema.safeParse(normalizedSource);

  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    };
  }

  return {
    ok: true,
    data: parsed.data
  };
}
