import { describe, expect, it } from "vitest";
import { loadAppEnv, patientInputSchema } from "@vnexus/shared";
import { planGatingBaseline } from "./plans/plan-gating";
import { consumerSummarySchema } from "./reports/contracts";

describe("Epic 0 contracts", () => {
  it("keeps insuranceJoinDate as required user input metadata", () => {
    const parsed = patientInputSchema.safeParse({
      patientName: "홍길동",
      insuranceJoinDate: "2022-01-01"
    });

    expect(parsed.success).toBe(true);
  });

  it("validates the consumer summary contract", () => {
    const parsed = consumerSummarySchema.safeParse({
      risk_signals: [],
      timeline_summary: [],
      hospital_summary: [],
      check_points: [],
      recommended_next_actions: []
    });

    expect(parsed.success).toBe(true);
  });

  it("blocks precision for 미리확인 and Starter", () => {
    expect(planGatingBaseline.consumer["미리확인"].precisionAllowed).toBe(false);
    expect(planGatingBaseline.investigator.Starter.precisionAllowed).toBe(false);
  });

  it("reports missing env variables in readiness validation", () => {
    const result = loadAppEnv({});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });
});
