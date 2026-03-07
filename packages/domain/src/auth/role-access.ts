import { UserRole } from "@vnexus/shared";

export function canAccessDashboard(role: UserRole, dashboard: "consumer" | "investigator" | "admin") {
  if (role === "admin") {
    return true;
  }

  return role === dashboard;
}
