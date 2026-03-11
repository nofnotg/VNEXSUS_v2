import { describe, expect, it } from "vitest";
import { createPreset, deletePreset, getPresetsForUser, getSharedPresets, searchShareCandidates, sharePreset } from "./analytics-preset-service";

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
          isShared: false,
          sharedWith: [],
          createdAt: new Date("2026-03-10T00:00:00.000Z")
        }),
        findManyByUser: async () => [],
        findByUserAndName: async () => null,
        findById: async () => null,
        updateShare: async () => undefined,
        findSharedForUser: async () => [],
        findUserContext: async () => null,
        findUsersInOrganizations: async () => [],
        searchUsersInOrganizations: async () => [],
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
            isShared: false,
            sharedWith: [],
            createdAt: new Date()
          }),
          findById: async () => null,
          updateShare: async () => undefined,
          findSharedForUser: async () => [],
          findUserContext: async () => null,
          findUsersInOrganizations: async () => [],
          searchUsersInOrganizations: async () => [],
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
          isShared: false,
          sharedWith: [],
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
        isShared: false,
        sharedWith: [],
        createdAt: new Date()
      }),
      updateShare: async () => undefined,
      findSharedForUser: async () => [],
      findUserContext: async () => null,
      findUsersInOrganizations: async () => [],
      searchUsersInOrganizations: async () => [],
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
          isShared: false,
          sharedWith: [],
          createdAt: new Date()
        }),
        updateShare: async () => undefined,
        findSharedForUser: async () => [],
        findUserContext: async () => null,
        findUsersInOrganizations: async () => [],
        searchUsersInOrganizations: async () => [],
        delete: async () => undefined
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("shares a preset with active team members and lists shared presets", async () => {
    const updateShareCalls: Array<{ id: string; sharedWith: string[] }> = [];

    await sharePreset(
      "preset-1",
      "user-1",
      ["reviewer@example.com", "Analyst Kim"],
      {
        create: async () => {
          throw new Error("not used");
        },
        findManyByUser: async () => [],
        findByUserAndName: async () => null,
        findById: async () => ({
          id: "preset-1",
          userId: "user-1",
          name: "Weekly review",
          filterJson: {},
          interval: "weekly",
          isShared: false,
          sharedWith: [],
          createdAt: new Date("2026-03-10T00:00:00.000Z")
        }),
        updateShare: async (id, sharedWith) => {
          updateShareCalls.push({ id, sharedWith });
        },
        findSharedForUser: async () => [
          {
            id: "preset-2",
            userId: "user-9",
            name: "Shared preset",
            filterJson: { hospitals: ["Seoul Hospital"] },
            interval: "daily",
            isShared: true,
            sharedWith: ["reviewer@example.com"],
            createdAt: new Date("2026-03-10T00:00:00.000Z")
          }
        ],
        findUserContext: async (userId) =>
          userId === "user-1"
            ? {
                id: "user-1",
                email: "owner@example.com",
                role: "investigator",
                status: "active",
                displayName: "Owner",
                organizationIds: ["org-1"]
              }
            : {
                id: "user-2",
                email: "reviewer@example.com",
                role: "investigator",
                status: "active",
                displayName: "Reviewer",
                organizationIds: ["org-1"]
              },
        findUsersInOrganizations: async () => [
          {
            id: "user-2",
            email: "reviewer@example.com",
            role: "investigator",
            status: "active",
            displayName: "Analyst Kim",
            organizationIds: ["org-1"]
          }
        ],
        searchUsersInOrganizations: async () => [],
        delete: async () => undefined
      }
    );

    expect(updateShareCalls).toEqual([
      {
        id: "preset-1",
        sharedWith: ["reviewer@example.com"]
      }
    ]);

    const shared = await getSharedPresets("user-2", {
      create: async () => {
        throw new Error("not used");
      },
      findManyByUser: async () => [],
      findByUserAndName: async () => null,
      findById: async () => null,
      updateShare: async () => undefined,
      findSharedForUser: async () => [
        {
          id: "preset-2",
          userId: "user-9",
          name: "Shared preset",
          filterJson: { hospitals: ["Seoul Hospital"] },
          interval: "daily",
          isShared: true,
          sharedWith: ["reviewer@example.com"],
          createdAt: new Date("2026-03-10T00:00:00.000Z")
        }
      ],
      findUserContext: async () => ({
        id: "user-2",
        email: "reviewer@example.com",
        role: "investigator",
        status: "active",
        displayName: "Reviewer",
        organizationIds: ["org-1"]
      }),
      findUsersInOrganizations: async () => [],
      searchUsersInOrganizations: async () => [],
      delete: async () => undefined
    });

    expect(shared).toHaveLength(1);
    expect(shared[0]?.isShared).toBe(true);
  });

  it("searches share candidates within the same organization only", async () => {
    const results = await searchShareCandidates("owner-1", "review", 1, {
      create: async () => {
        throw new Error("not used");
      },
      findManyByUser: async () => [],
      findByUserAndName: async () => null,
      findById: async () => null,
      updateShare: async () => undefined,
      findSharedForUser: async () => [],
      findUserContext: async () => ({
        id: "owner-1",
        email: "owner@example.com",
        role: "investigator",
        status: "active",
        displayName: "Owner",
        organizationIds: ["org-1"]
      }),
      findUsersInOrganizations: async () => [],
      searchUsersInOrganizations: async () => [
        {
          id: "user-2",
          email: "reviewer@example.com",
          role: "investigator",
          status: "active",
          displayName: "Reviewer",
          organizationIds: ["org-1"]
        }
      ],
      delete: async () => undefined
    });

    expect(results).toEqual({
      items: [
        {
          userId: "user-2",
          email: "reviewer@example.com",
          displayName: "Reviewer"
        }
      ],
      page: 1,
      hasMore: false
    });
  });
});
