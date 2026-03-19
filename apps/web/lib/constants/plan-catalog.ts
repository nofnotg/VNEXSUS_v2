export const consumerPlanCatalog = [
  {
    code: "consumer-precheck",
    name: "誘몃━?뺤씤",
    audience: "consumer" as const,
    billingType: "credit" as const,
    accessModel: "packet" as const
  },
  {
    code: "consumer-precision",
    name: "?뺣??뺤씤",
    audience: "consumer" as const,
    billingType: "credit" as const,
    accessModel: "packet" as const
  },
  {
    code: "consumer-expert-link",
    name: "?꾨Ц媛?곌껐",
    audience: "consumer" as const,
    billingType: "credit" as const,
    accessModel: "packet" as const
  }
] as const;

export const investigatorPlanCatalog = [
  {
    code: "investigator-starter",
    name: "Starter",
    audience: "investigator" as const,
    billingType: "subscription" as const,
    accessModel: "subscription" as const
  },
  {
    code: "investigator-pro",
    name: "Pro",
    audience: "investigator" as const,
    billingType: "subscription" as const,
    accessModel: "subscription" as const
  },
  {
    code: "investigator-studio",
    name: "Studio",
    audience: "investigator" as const,
    billingType: "subscription" as const,
    accessModel: "subscription" as const
  }
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
export type PlanMeta = (typeof fullPlanCatalog)[number];

export function getPlansForRole(role: "consumer" | "investigator" | "admin") {
  if (role === "investigator") {
    return investigatorPlanCatalog;
  }

  if (role === "consumer") {
    return consumerPlanCatalog;
  }

  return [];
}

export function getPlanMeta(planCode: string | null | undefined) {
  if (!planCode) {
    return null;
  }

  return fullPlanCatalog.find((plan) => plan.code === planCode) ?? null;
}
