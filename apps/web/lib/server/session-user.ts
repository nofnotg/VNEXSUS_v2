import { prisma } from "../prisma";
import { getSessionUser } from "../session";
import { isLocalDemoMode } from "./demo-mode";

export async function requireSessionRecord() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return null;
  }

  if (isLocalDemoMode()) {
    return {
      sessionUser,
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        role: sessionUser.role,
        status: sessionUser.status
      }
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email }
  });

  if (!user) {
    return null;
  }

  return {
    sessionUser,
    user
  };
}
