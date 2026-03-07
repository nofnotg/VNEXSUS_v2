import { cookies } from "next/headers";
import { UserRole, UserStatus } from "@vnexus/shared";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "vnexus_session";

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as SessionUser;
    if (!parsed.id || !parsed.email || !parsed.role || !parsed.status) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
