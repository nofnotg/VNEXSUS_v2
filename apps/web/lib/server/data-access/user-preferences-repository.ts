import { prisma } from "../../prisma";

export type UserPreferencesRecord = {
  locale: string | null;
  theme: string | null;
};

export const userPreferencesRepository = {
  async findProfile(userId: string): Promise<UserPreferencesRecord | null> {
    return prisma.profile.findUnique({
      where: { userId },
      select: {
        locale: true,
        theme: true
      }
    });
  },

  async upsertProfilePreferences(userId: string, locale?: string, theme?: string): Promise<UserPreferencesRecord> {
    return prisma.profile.upsert({
      where: { userId },
      update: {
        ...(locale !== undefined ? { locale } : {}),
        ...(theme !== undefined ? { theme } : {})
      },
      create: {
        userId,
        ...(locale !== undefined ? { locale } : {}),
        ...(theme !== undefined ? { theme } : {})
      },
      select: {
        locale: true,
        theme: true
      }
    });
  }
};
