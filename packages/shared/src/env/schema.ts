import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_BASE_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  SESSION_COOKIE_NAME: z.string().min(1),
  OCR_PROVIDER: z.literal("google-vision"),
  LLM_PROVIDER: z.literal("openai")
});

export type AppEnv = z.infer<typeof envSchema>;
