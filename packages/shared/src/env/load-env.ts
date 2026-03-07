import { envSchema, type AppEnv } from "./schema";

export function loadAppEnv(source: NodeJS.ProcessEnv = process.env):
  | { ok: true; data: AppEnv }
  | { ok: false; issues: string[] } {
  const parsed = envSchema.safeParse(source);

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
