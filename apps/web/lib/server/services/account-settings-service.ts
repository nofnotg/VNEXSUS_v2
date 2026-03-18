import { ApiError, normalizeLocaleCode, type LocaleCode } from "@vnexus/shared";
import { prisma } from "../../prisma";
import { hashPassword, verifyPassword } from "../auth/password";

type ThemeMode = "light" | "dark";

export type AccountSettings = {
  name: string;
  email: string;
  phone: string;
  region: string;
  locale: LocaleCode;
  theme: ThemeMode;
};

type AccountRecord = Awaited<ReturnType<typeof loadAccountRecord>>;

function normalizeTheme(value: string | null | undefined): ThemeMode {
  return value === "dark" ? "dark" : "light";
}

function parseRoleDetail(raw: string | null | undefined) {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return { legacyValue: raw };
  }
}

async function loadAccountRecord(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      profile: {
        select: {
          displayName: true,
          phone: true,
          locale: true,
          theme: true,
          roleDetail: true
        }
      }
    }
  });
}

function toAccountSettings(record: AccountRecord, fallbackEmail: string): AccountSettings {
  const email = record?.email ?? fallbackEmail;
  const roleDetail = parseRoleDetail(record?.profile?.roleDetail);
  const region = typeof roleDetail.region === "string" ? roleDetail.region : "";

  return {
    name: record?.profile?.displayName?.trim() || email.split("@")[0] || "사용자",
    email,
    phone: record?.profile?.phone?.trim() ?? "",
    region,
    locale: normalizeLocaleCode(record?.profile?.locale),
    theme: normalizeTheme(record?.profile?.theme)
  };
}

export async function getAccountSettings(userId: string, email: string) {
  const record = await loadAccountRecord(userId);
  return toAccountSettings(record, email);
}

export async function verifyAccountAccess(userId: string, email: string, currentPassword: string) {
  if (currentPassword.trim().length < 4) {
    throw new ApiError("VALIDATION_ERROR", "현재 비밀번호를 확인해 주세요.");
  }

  const record = await loadAccountRecord(userId);
  const verified = verifyPassword(currentPassword, record?.passwordHash);

  if (!verified) {
    throw new ApiError("FORBIDDEN", "비밀번호 확인에 실패했습니다.");
  }

  return toAccountSettings(record, email);
}

export async function updateAccountSettings(
  userId: string,
  email: string,
  input: {
    currentPassword: string;
    phone?: string;
    region?: string;
    locale?: LocaleCode;
    theme?: ThemeMode;
    newPassword?: string;
  }
) {
  await verifyAccountAccess(userId, email, input.currentPassword);

  const current = await loadAccountRecord(userId);
  const currentRoleDetail = parseRoleDetail(current?.profile?.roleDetail);
  const nextRoleDetail = JSON.stringify({
    ...currentRoleDetail,
    region: input.region?.trim() ?? ""
  });

  await prisma.user.upsert({
    where: { id: userId },
    update: {
      ...(input.newPassword ? { passwordHash: hashPassword(input.newPassword) } : {})
    },
    create: {
      id: userId,
      email,
      role: "consumer",
      status: "active",
      ...(input.newPassword ? { passwordHash: hashPassword(input.newPassword) } : {})
    }
  });

  await prisma.profile.upsert({
    where: { userId },
    update: {
      phone: input.phone?.trim() ?? "",
      roleDetail: nextRoleDetail,
      ...(input.locale !== undefined ? { locale: input.locale } : {}),
      ...(input.theme !== undefined ? { theme: input.theme } : {})
    },
    create: {
      userId,
      displayName: current?.profile?.displayName ?? email.split("@")[0] ?? "사용자",
      phone: input.phone?.trim() ?? "",
      roleDetail: nextRoleDetail,
      ...(input.locale !== undefined ? { locale: input.locale } : {}),
      ...(input.theme !== undefined ? { theme: input.theme } : {})
    }
  });

  return getAccountSettings(userId, email);
}
