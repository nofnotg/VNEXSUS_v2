import { z } from "zod";

const optionalUrlFromBlank = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value.length === 0 ? undefined : value))
  .pipe(z.string().url().optional());

const optionalStringFromBlank = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_BASE_URL: z.string().url(),
  LOCAL_DEMO_MODE: z.coerce.boolean().default(false),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  SESSION_COOKIE_NAME: z.string().min(1),
  STORAGE_DRIVER: z.enum(["gcs", "supabase"]).default("gcs"),
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_PUBLIC_BASE_URL: optionalUrlFromBlank,
  UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().positive().default(20),
  UPLOAD_ALLOWED_MIME_TYPES: z
    .string()
    .default("application/pdf,image/png,image/jpeg")
    .transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean)),
  OCR_PROVIDER: z.literal("google-vision"),
  OCR_MODE: z.enum(["mock", "google-vision"]).default("google-vision"),
  GOOGLE_CLOUD_PROJECT_ID: optionalStringFromBlank,
  GOOGLE_APPLICATION_CREDENTIALS: optionalStringFromBlank,
  GOOGLE_CLOUD_VISION_API_KEY: optionalStringFromBlank,
  GOOGLE_CLOUD_RUN_BASE64_ENDPOINT: optionalUrlFromBlank,
  LLM_PROVIDER: z.literal("openai"),
  ANALYTICS_PRESET_CACHE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  ANALYTICS_EXPORT_MAX_DAYS: z.coerce.number().int().positive().default(366),
  ANALYTICS_EXPORT_MAX_FILTER_VALUES: z.coerce.number().int().positive().default(20),
  ANALYTICS_SLOW_QUERY_MS: z.coerce.number().int().positive().default(400),
  ANALYTICS_ALERT_WEBHOOK_URL: optionalUrlFromBlank
}).superRefine((value, context) => {
  if (value.OCR_MODE === "google-vision") {
    const hasServiceAccount = Boolean(value.GOOGLE_APPLICATION_CREDENTIALS);
    const hasApiKey = Boolean(value.GOOGLE_CLOUD_VISION_API_KEY);

    if (!hasServiceAccount && !hasApiKey) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GOOGLE_APPLICATION_CREDENTIALS"],
        message: "Service account credentials or Vision API key are required for real OCR mode"
      });
    }
  }
});

export type AppEnv = z.infer<typeof envSchema>;
