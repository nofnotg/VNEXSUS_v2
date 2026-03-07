import { redirect } from "next/navigation";
import { UserRole } from "@vnexus/shared";
import { getSessionUser } from "./session";

export async function requireAuthenticatedUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuthenticatedUser();

  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}
