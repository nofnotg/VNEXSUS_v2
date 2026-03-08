export * from "./auth/role-access";
export * from "./bundles";
export * from "./cases/contracts";
export * from "./dates";
export * from "./documents/invariants";
export * from "./entities";
export * from "./events";
export * from "./output";
export * from "./plans/plan-gating";
export * from "./reports/contracts";
export * from "./windows";

export function createWorkerRuntimeSummary() {
  return {
    status: "baseline-ready",
    queues: ["ocr", "extraction", "precision", "report"],
    note: "Epic 0 sets process boundaries only. Providers and processors are deferred."
  };
}
