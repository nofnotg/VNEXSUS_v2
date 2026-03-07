import { createWorkerRuntimeSummary } from "@vnexus/domain";

const summary = createWorkerRuntimeSummary();

console.log("[worker] bootstrap complete");
console.log(JSON.stringify(summary, null, 2));
