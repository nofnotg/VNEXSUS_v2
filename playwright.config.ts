import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  webServer: {
    command: "pnpm --filter @vnexus/web dev",
    url: process.env.APP_BASE_URL ?? "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120_000
  },
  use: {
    baseURL: process.env.APP_BASE_URL ?? "http://127.0.0.1:3000"
  }
});
