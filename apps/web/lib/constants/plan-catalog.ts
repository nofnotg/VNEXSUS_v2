export const consumerPlanCatalog = [
  { code: "consumer-precheck", name: "미리확인", audience: "consumer" as const },
  { code: "consumer-precision", name: "정밀확인", audience: "consumer" as const },
  { code: "consumer-expert-link", name: "전문가연결", audience: "consumer" as const }
] as const;

export const investigatorPlanCatalog = [
  { code: "investigator-starter", name: "Starter", audience: "investigator" as const },
  { code: "investigator-pro", name: "Pro", audience: "investigator" as const },
  { code: "investigator-studio", name: "Studio", audience: "investigator" as const }
] as const;

export const fullPlanCatalog = [...consumerPlanCatalog, ...investigatorPlanCatalog] as const;

export const planCodes = [
  "consumer-precheck",
  "consumer-precision",
  "consumer-expert-link",
  "investigator-starter",
  "investigator-pro",
  "investigator-studio"
] as const;

export type PlanCode = (typeof planCodes)[number];

export function getPlansForRole(role: "consumer" | "investigator" | "admin") {
  if (role === "investigator") {
    return investigatorPlanCatalog;
  }

  if (role === "consumer") {
    return consumerPlanCatalog;
  }

  return [];
}
