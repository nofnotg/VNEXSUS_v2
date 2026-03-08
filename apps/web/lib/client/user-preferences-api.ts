import { apiErrorEnvelopeSchema, apiSuccessEnvelopeSchema } from "@vnexus/shared";
import { z } from "zod";

const userPreferencesSchema = z.object({
  locale: z.enum(["en", "ko"]),
  theme: z.enum(["light", "dark"])
});

export async function syncUserPreferences(preferences: { locale?: "en" | "ko"; theme?: "light" | "dark" }) {
  const response = await fetch("/api/user/preferences", {
    method: "PUT",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(preferences)
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = apiErrorEnvelopeSchema.safeParse(json);
    if (parsedError.success) {
      throw new Error(parsedError.data.error.message);
    }

    throw new Error("Failed to sync user preferences");
  }

  const parsed = apiSuccessEnvelopeSchema(userPreferencesSchema).safeParse(json);
  if (!parsed.success) {
    throw new Error("Invalid user preferences response");
  }

  return parsed.data.data;
}
