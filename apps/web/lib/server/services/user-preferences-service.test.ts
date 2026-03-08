import { describe, expect, it } from "vitest";
import { getUserPreferences, updateUserPreferences } from "./user-preferences-service";

describe("user-preferences-service", () => {
  it("returns normalized defaults when profile preferences are missing", async () => {
    const result = await getUserPreferences("user-1", {
      findProfile: async () => ({ locale: null, theme: null })
    });

    expect(result).toEqual({ locale: "en", theme: "light" });
  });

  it("updates user preferences", async () => {
    const result = await updateUserPreferences(
      "user-1",
      { locale: "ko", theme: "dark" },
      {
        upsertProfilePreferences: async (_userId, locale, theme) => ({ locale: locale ?? null, theme: theme ?? null })
      }
    );

    expect(result).toEqual({ locale: "ko", theme: "dark" });
  });

  it("rejects invalid theme values", async () => {
    await expect(
      updateUserPreferences(
        "user-1",
        { theme: "midnight" as never },
        {
          upsertProfilePreferences: async () => ({ locale: "en", theme: "light" })
        }
      )
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});
