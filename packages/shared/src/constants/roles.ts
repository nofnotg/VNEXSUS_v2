export const userRoles = ["consumer", "investigator", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const userStatuses = ["pending", "active", "suspended"] as const;
export type UserStatus = (typeof userStatuses)[number];

export const consumerPlanNames = ["미리확인", "정밀확인", "전문가연결"] as const;
export const investigatorPlanNames = ["Starter", "Pro", "Studio"] as const;
