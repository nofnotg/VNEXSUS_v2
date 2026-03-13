import { loadAppEnv } from "@vnexus/shared";

export function isLocalDemoMode() {
  const envResult = loadAppEnv();
  return envResult.ok ? envResult.data.LOCAL_DEMO_MODE : process.env.LOCAL_DEMO_MODE === "true";
}

export function isMockOcrMode() {
  const envResult = loadAppEnv();
  return envResult.ok ? envResult.data.OCR_MODE === "mock" : process.env.OCR_MODE === "mock";
}
