import {
  ApiError,
  analyticsIntervalSchema,
  analyticsPresetSchema,
  analyticsShareCandidateSearchSchema,
  analyticsShareCandidateSchema,
  caseAnalyticsFilterSchema,
  type AnalyticsShareCandidate,
  type AnalyticsShareCandidateSearchResult,
  type CaseAnalyticsPreset
} from "@vnexus/shared";
import { prisma } from "../../prisma";
import { getOwnedPresetCache, getSharedPresetCache, invalidatePresetCaches, setOwnedPresetCache, setSharedPresetCache } from "./analytics-preset-cache";
import { logAnalyticsEvent, measureAnalyticsOperation, recordAnalyticsMetric } from "../analytics-observability";

type PresetRecord = {
  id: string;
  userId: string;
  name: string;
  filterJson: unknown;
  interval: string;
  isShared: boolean;
  sharedWith: string[];
  createdAt: Date;
};

type UserContextRecord = {
  id: string;
  email: string;
  role: string;
  status: string;
  displayName: string | null;
  organizationIds: string[];
};

type PresetRepository = {
  create(args: { userId: string; name: string; filterJson: unknown; interval: string }): Promise<PresetRecord>;
  findManyByUser(userId: string): Promise<PresetRecord[]>;
  findByUserAndName(userId: string, name: string): Promise<PresetRecord | null>;
  findById(id: string): Promise<PresetRecord | null>;
  updateShare(id: string, sharedWith: string[]): Promise<void>;
  findSharedForUser(email: string, organizationIds: string[], userId: string): Promise<PresetRecord[]>;
  findUserContext(userId: string): Promise<UserContextRecord | null>;
  findUsersInOrganizations(organizationIds: string[], excludeUserId: string): Promise<UserContextRecord[]>;
  searchUsersInOrganizations(organizationIds: string[], query: string, excludeUserId: string, skip: number, take: number): Promise<UserContextRecord[]>;
  delete(id: string): Promise<void>;
};

const analyticsPresetRepository: PresetRepository = {
  create: (args) =>
    prisma.analyticsPreset.create({
      data: {
        userId: args.userId,
        name: args.name,
        filterJson: args.filterJson as never,
        interval: args.interval
      }
    }),
  findManyByUser: (userId) =>
    measureAnalyticsOperation(
      "analytics.query.preset_lookup",
      () =>
        prisma.analyticsPreset.findMany({
          where: { userId },
          orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
        }),
      {
        metricKey: "query_preset_lookup",
        payload: { viewerRole: "owner" }
      }
    ),
  findByUserAndName: (userId, name) =>
    prisma.analyticsPreset.findFirst({
      where: { userId, name }
    }),
  findById: (id) =>
    prisma.analyticsPreset.findUnique({
      where: { id }
    }),
  updateShare: async (id, sharedWith) => {
    await prisma.analyticsPreset.update({
      where: { id },
      data: {
        isShared: sharedWith.length > 0,
        sharedWith
      }
    });
  },
  findSharedForUser: (email, organizationIds, userId) =>
    measureAnalyticsOperation(
      "analytics.query.shared_preset_lookup",
      () =>
        prisma.analyticsPreset.findMany({
          where: {
            userId: {
              not: userId
            },
            isShared: true,
            sharedWith: {
              has: email
            },
            user: {
              memberships: {
                some: {
                  organizationId: {
                    in: organizationIds
                  }
                }
              }
            }
          },
          orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
        }),
      {
        metricKey: "query_shared_preset_lookup",
        payload: { organizationCount: organizationIds.length }
      }
    ),
  findUserContext: async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        profile: {
          select: {
            displayName: true
          }
        },
        memberships: {
          select: {
            organizationId: true
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      displayName: user.profile?.displayName ?? null,
      organizationIds: user.memberships.map((membership) => membership.organizationId)
    };
  },
  findUsersInOrganizations: async (organizationIds, excludeUserId) => {
    if (organizationIds.length === 0) {
      return [];
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        memberships: {
          some: {
            organizationId: { in: organizationIds }
          }
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        profile: {
          select: {
            displayName: true
          }
        },
        memberships: {
          where: {
            organizationId: { in: organizationIds }
          },
          select: {
            organizationId: true
          }
        }
      }
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      displayName: user.profile?.displayName ?? null,
      organizationIds: user.memberships.map((membership) => membership.organizationId)
    }));
  },
  searchUsersInOrganizations: async (organizationIds, query, excludeUserId, skip, take) => {
    if (organizationIds.length === 0 || !query.trim()) {
      return [];
    }

    const users = await measureAnalyticsOperation(
      "analytics.query.share_candidate_lookup",
      () =>
        prisma.user.findMany({
          where: {
            id: { not: excludeUserId },
            status: "active",
            role: {
              not: "consumer"
            },
            memberships: {
              some: {
                organizationId: { in: organizationIds }
              }
            },
            OR: [
              {
                email: {
                  contains: query,
                  mode: "insensitive"
                }
              },
              {
                profile: {
                  displayName: {
                    contains: query,
                    mode: "insensitive"
                  }
                }
              }
            ]
          },
          skip,
          take,
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            profile: {
              select: {
                displayName: true
              }
            },
            memberships: {
              where: {
                organizationId: { in: organizationIds }
              },
              select: {
                organizationId: true
              }
            }
          }
        }),
      {
        metricKey: "query_share_candidate_lookup",
        payload: { organizationCount: organizationIds.length, pageSize: take }
      }
    );

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      displayName: user.profile?.displayName ?? null,
      organizationIds: user.memberships.map((membership) => membership.organizationId)
    }));
  },
  delete: async (id) => {
    await prisma.analyticsPreset.delete({
      where: { id }
    });
  }
};

function toPreset(record: PresetRecord): CaseAnalyticsPreset {
  return analyticsPresetSchema.parse({
    presetId: record.id,
    userId: record.userId,
    name: record.name,
    filter: caseAnalyticsFilterSchema.parse(record.filterJson ?? {}),
    interval: analyticsIntervalSchema.parse(record.interval),
    isShared: record.isShared,
    sharedWith: record.sharedWith ?? [],
    createdAt: record.createdAt.toISOString()
  });
}

function normalizeShareTargets(sharedWith: string[]) {
  return [...new Set(sharedWith.map((value) => value.trim()).filter(Boolean))];
}

function buildMatchIndex(users: UserContextRecord[]) {
  const byEmail = new Map<string, UserContextRecord>();
  const byName = new Map<string, UserContextRecord[]>();

  for (const user of users) {
    byEmail.set(user.email.trim().toLowerCase(), user);

    if (user.displayName?.trim()) {
      const key = user.displayName.trim().toLowerCase();
      byName.set(key, [...(byName.get(key) ?? []), user]);
    }
  }

  return { byEmail, byName };
}

export async function createPreset(
  userId: string,
  input: { name: string; filter: unknown; interval: unknown },
  repository: PresetRepository = analyticsPresetRepository
) {
  const name = input.name.trim();
  if (!name) {
    throw new ApiError("VALIDATION_ERROR", "Preset name is required");
  }

  const filter = caseAnalyticsFilterSchema.parse(input.filter ?? {});
  const interval = analyticsIntervalSchema.parse(input.interval);
  const existing = await repository.findByUserAndName(userId, name);

  if (existing) {
    throw new ApiError("CONFLICT", "Preset name already exists");
  }

  const created = await repository.create({
    userId,
    name,
    filterJson: filter,
    interval
  });
  invalidatePresetCaches({ ownerUserId: userId });

  return toPreset(created);
}

export async function getPresetsForUser(
  userId: string,
  repository: PresetRepository = analyticsPresetRepository
) {
  const cached = getOwnedPresetCache<CaseAnalyticsPreset[]>(userId);
  if (cached) {
    return cached;
  }

  const records = await repository.findManyByUser(userId);
  const presets = records.map(toPreset);
  setOwnedPresetCache(userId, presets);
  return presets;
}

export async function sharePreset(
  presetId: string,
  ownerId: string,
  sharedWith: string[],
  repository: PresetRepository = analyticsPresetRepository
) {
  const preset = await repository.findById(presetId);

  if (!preset) {
    throw new ApiError("NOT_FOUND", "Preset not found");
  }

  if (preset.userId !== ownerId) {
    throw new ApiError("FORBIDDEN", "Cannot share another user's preset");
  }

  const owner = await repository.findUserContext(ownerId);
  if (!owner) {
    throw new ApiError("NOT_FOUND", "Owner not found");
  }

  if (owner.organizationIds.length === 0) {
    throw new ApiError("FORBIDDEN", "Preset sharing requires an organization membership");
  }

  const requestedTargets = normalizeShareTargets(sharedWith);
  if (requestedTargets.length === 0) {
    throw new ApiError("VALIDATION_ERROR", "At least one share target is required");
  }

  const teamMembers = (
    await measureAnalyticsOperation(
      "analytics.team_members.lookup",
      () => repository.findUsersInOrganizations(owner.organizationIds, ownerId),
      {
        payload: { organizationCount: owner.organizationIds.length }
      }
    )
  ).filter((user) => user.status === "active" && user.role !== "consumer");
  const { byEmail, byName } = buildMatchIndex(teamMembers);

  const resolvedEmails: string[] = [];
  const unresolved: string[] = [];
  const ambiguous: string[] = [];

  for (const target of requestedTargets) {
    const normalized = target.toLowerCase();
    const byEmailMatch = byEmail.get(normalized);

    if (byEmailMatch) {
      resolvedEmails.push(byEmailMatch.email);
      continue;
    }

    const nameMatches = byName.get(normalized) ?? [];
    if (nameMatches.length === 1) {
      resolvedEmails.push(nameMatches[0]!.email);
      continue;
    }

    if (nameMatches.length > 1) {
      ambiguous.push(target);
      continue;
    }

    unresolved.push(target);
  }

  if (ambiguous.length > 0 || unresolved.length > 0) {
    recordAnalyticsMetric("preset_share", { failed: true });
    logAnalyticsEvent(
      "preset.share.rejected",
      {
        organizationCount: owner.organizationIds.length,
        ambiguous,
        unresolved
      },
      "error"
    );
    throw new ApiError("VALIDATION_ERROR", "Some share targets could not be resolved to team members", {
      ambiguous,
      unresolved
    });
  }

  const uniqueEmails = [...new Set(resolvedEmails)].sort((left, right) => left.localeCompare(right));
  await measureAnalyticsOperation(
    "analytics.preset.share_update",
    () => repository.updateShare(presetId, uniqueEmails),
    {
      metricKey: "preset_share",
      payload: {
        sharedWithCount: uniqueEmails.length,
        organizationCount: owner.organizationIds.length
      }
    }
  );
  invalidatePresetCaches({ ownerUserId: ownerId, sharedEmails: uniqueEmails });
  logAnalyticsEvent("preset.share.completed", {
    sharedWithCount: uniqueEmails.length
  });
}

export async function getSharedPresets(
  userId: string,
  repository: PresetRepository = analyticsPresetRepository
) {
  const user = await repository.findUserContext(userId);
  if (!user) {
    return [];
  }

  const cached = getSharedPresetCache<CaseAnalyticsPreset[]>(user.email);
  if (cached) {
    return cached;
  }

  if (user.organizationIds.length === 0) {
    return [];
  }

  const records = await repository.findSharedForUser(user.email, user.organizationIds, userId);
  const presets = records.map(toPreset);
  setSharedPresetCache(user.email, presets);
  return presets;
}

export async function searchShareCandidates(
  ownerId: string,
  query: string,
  page = 1,
  repository: PresetRepository = analyticsPresetRepository
): Promise<AnalyticsShareCandidateSearchResult> {
  const owner = await repository.findUserContext(ownerId);
  if (!owner) {
    throw new ApiError("NOT_FOUND", "Owner not found");
  }

  if (owner.organizationIds.length === 0) {
    throw new ApiError("FORBIDDEN", "Preset sharing requires an organization membership");
  }

  const normalized = query.trim();
  if (normalized.length < 2) {
    return analyticsShareCandidateSearchSchema.parse({
      items: [],
      page: 1,
      hasMore: false
    });
  }

  const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const pageSize = 5;
  const users = await repository.searchUsersInOrganizations(owner.organizationIds, normalized, ownerId, (normalizedPage - 1) * pageSize, pageSize + 1);
  const hasMore = users.length > pageSize;
  const candidates = users
    .slice(0, pageSize)
    .filter((user) => user.status === "active" && user.role !== "consumer")
    .map((user) =>
      analyticsShareCandidateSchema.parse({
        userId: user.id,
        email: user.email,
        displayName: user.displayName
      })
    );

  recordAnalyticsMetric("preset_share_search", {
    rows: candidates.length
  });
  logAnalyticsEvent("preset.share.search", {
    page: normalizedPage,
    queryLength: normalized.length,
    resultCount: candidates.length,
    hasMore
  });

  return analyticsShareCandidateSearchSchema.parse({
    items: candidates,
    page: normalizedPage,
    hasMore
  });
}

export async function deletePreset(
  userId: string,
  presetId: string,
  repository: PresetRepository = analyticsPresetRepository
) {
  const preset = await repository.findById(presetId);

  if (!preset) {
    throw new ApiError("NOT_FOUND", "Preset not found");
  }

  if (preset.userId !== userId) {
    throw new ApiError("FORBIDDEN", "Cannot delete another user's preset");
  }

  await repository.delete(presetId);
  invalidatePresetCaches({ ownerUserId: userId, sharedEmails: preset.sharedWith });
}
