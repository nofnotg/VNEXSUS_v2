import { prisma } from "../prisma";
import { getSessionUser } from "../session";

export async function requireSessionRecord() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return null;
  }

  // TODO(auth): remove this dev/test convenience path once a real auth provider
  // persists users. This upsert exists only so Epic 0/1 API skeletons can run
  // with session cookies before production auth wiring is introduced.
  const user = await prisma.user.upsert({
    where: { email: sessionUser.email },
    update: {
      role: sessionUser.role,
      status: sessionUser.status
    },
    create: {
      email: sessionUser.email,
      role: sessionUser.role,
      status: sessionUser.status
    }
  });

  return {
    sessionUser,
    user
  };
}
