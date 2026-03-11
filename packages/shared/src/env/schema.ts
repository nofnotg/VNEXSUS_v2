import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_BASE_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  SESSION_COOKIE_NAME: z.string().min(1),
  STORAGE_DRIVER: z.enum(["gcs", "supabase"]).default("gcs"),
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_PUBLIC_BASE_URL: z.string().url().optional(),
  UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().positive().default(20),
  UPLOAD_ALLOWED_MIME_TYPES: z
    .string()
    .default("application/pdf,image/png,image/jpeg")
    .transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean)),
  OCR_PROVIDER: z.literal("google-vision"),
  LLM_PROVIDER: z.literal("openai"),
  ANALYTICS_PRESET_CACHE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  ANALYTICS_EXPORT_MAX_DAYS: z.coerce.number().int().positive().default(366),
  ANALYTICS_EXPORT_MAX_FILTER_VALUES: z.coerce.number().int().positive().default(20),
  ANALYTICS_SLOW_QUERY_MS: z.coerce.number().int().positive().default(400),
  ANALYTICS_ALERT_WEBHOOK_URL: z.string().url().optional()
});

export type AppEnv = z.infer<typeof envSchema>;
