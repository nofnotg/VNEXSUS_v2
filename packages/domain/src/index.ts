export * from "./auth/role-access";
export * from "./cases/contracts";
export * from "./documents/invariants";
export * from "./plans/plan-gating";
export * from "./reports/contracts";

export function createWorkerRuntimeSummary() {
  return {
    status: "baseline-ready",
    queues: ["ocr", "extraction", "precision", "report"],
    note: "Epic 0 sets process boundaries only. Providers and processors are deferred."
  };
}
