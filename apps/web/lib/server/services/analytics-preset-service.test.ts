import { describe, expect, it } from "vitest";
import { createPreset, deletePreset, getPresetsForUser } from "./analytics-preset-service";

describe("analytics preset service", () => {
  it("creates and validates a preset", async () => {
    const preset = await createPreset(
      "user-1",
      {
        name: "Recent exams",
        filter: { eventTypes: ["exam"] },
        interval: "weekly"
      },
      {
        create: async (args) => ({
          id: "preset-1",
          userId: args.userId,
          name: args.name,
          filterJson: args.filterJson,
          interval: args.interval,
          createdAt: new Date("2026-03-10T00:00:00.000Z")
        }),
        findManyByUser: async () => [],
        findByUserAndName: async () => null,
        findById: async () => null,
        delete: async () => undefined
      }
    );

    expect(preset.name).toBe("Recent exams");
    expect(preset.interval).toBe("weekly");
  });

  it("rejects duplicate preset names", async () => {
    await expect(
      createPreset(
        "user-1",
        {
          name: "Recent exams",
          filter: {},
          interval: "daily"
        },
        {
          create: async () => {
            throw new Error("should not create");
          },
          findManyByUser: async () => [],
          findByUserAndName: async () => ({
            id: "preset-1",
            userId: "user-1",
            name: "Recent exams",
            filterJson: {},
            interval: "daily",
            createdAt: new Date()
          }),
          findById: async () => null,
          delete: async () => undefined
        }
      )
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("lists and deletes owned presets", async () => {
    const list = await getPresetsForUser("user-1", {
      create: async () => {
        throw new Error("not used");
      },
      findManyByUser: async () => [
        {
          id: "preset-1",
          userId: "user-1",
          name: "Default 30 days",
          filterJson: { startDate: "2026-02-10", endDate: "2026-03-10" },
          interval: "daily",
          createdAt: new Date("2026-03-10T00:00:00.000Z")
        }
      ],
      findByUserAndName: async () => null,
      findById: async (id) => ({
        id,
        userId: "user-1",
        name: "Default 30 days",
        filterJson: {},
        interval: "daily",
        createdAt: new Date()
      }),
      delete: async () => undefined
    });

    expect(list).toHaveLength(1);
    await expect(
      deletePreset("user-2", "preset-1", {
        create: async () => {
          throw new Error("not used");
        },
        findManyByUser: async () => [],
        findByUserAndName: async () => null,
        findById: async () => ({
          id: "preset-1",
          userId: "user-1",
          name: "Default 30 days",
          filterJson: {},
          interval: "daily",
          createdAt: new Date()
        }),
        delete: async () => undefined
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
