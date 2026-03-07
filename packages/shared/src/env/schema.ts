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
  LLM_PROVIDER: z.literal("openai")
});

export type AppEnv = z.infer<typeof envSchema>;
