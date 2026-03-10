import { ApiError, analyticsPresetSchema, caseAnalyticsFilterSchema, caseAnalyticsTrendSchema, type CaseAnalyticsPreset } from "@vnexus/shared";
import { prisma } from "../../prisma";

type PresetRecord = {
  id: string;
  userId: string;
  name: string;
  filterJson: unknown;
  interval: string;
  createdAt: Date;
};

type PresetRepository = {
  create(args: { userId: string; name: string; filterJson: unknown; interval: string }): Promise<PresetRecord>;
  findManyByUser(userId: string): Promise<PresetRecord[]>;
  findByUserAndName(userId: string, name: string): Promise<PresetRecord | null>;
  findById(id: string): Promise<PresetRecord | null>;
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
    prisma.analyticsPreset.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    }),
  findByUserAndName: (userId, name) =>
    prisma.analyticsPreset.findFirst({
      where: { userId, name }
    }),
  findById: (id) =>
    prisma.analyticsPreset.findUnique({
      where: { id }
    }),
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
    interval: caseAnalyticsTrendSchema.shape.interval.parse(record.interval),
    createdAt: record.createdAt.toISOString()
  });
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
  const interval = caseAnalyticsTrendSchema.shape.interval.parse(input.interval);
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

  return toPreset(created);
}

export async function getPresetsForUser(
  userId: string,
  repository: PresetRepository = analyticsPresetRepository
) {
  const records = await repository.findManyByUser(userId);
  return records.map(toPreset);
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
}
