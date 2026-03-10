import type { Prisma } from "@prisma/client";
import type { CaseAnalyticsFilter, CaseAnalyticsTrend } from "@vnexus/shared";
import { prisma } from "../../prisma";

export type CaseAnalyticsRepositoryResult = {
  totalCases: number;
  totalEvents: number;
  confirmedEvents: number;
  unconfirmedEvents: number;
  reviewRequiredEvents: number;
  eventsByType: Array<{ key: string; count: number }>;
  eventsByHospital: Array<{ key: string; count: number }>;
  topHospitals: Array<{ hospital: string; events: number }>;
};

type TrendPoint = CaseAnalyticsTrend["points"][number];

function normalizeFilter(filter?: CaseAnalyticsFilter): CaseAnalyticsFilter {
  return {
    startDate: filter?.startDate,
    endDate: filter?.endDate,
    eventTypes: filter?.eventTypes?.filter(Boolean),
    hospitals: filter?.hospitals?.filter(Boolean)
  };
}

function buildEventWhere(userId: string, isAdmin: boolean, filter?: CaseAnalyticsFilter): Prisma.EventAtomWhereInput {
  const normalized = normalizeFilter(filter);

  return {
    ...(isAdmin ? {} : { case: { ownerUserId: userId } }),
    ...(normalized.startDate || normalized.endDate
      ? {
          canonicalDate: {
            ...(normalized.startDate ? { gte: normalized.startDate } : {}),
            ...(normalized.endDate ? { lte: normalized.endDate } : {})
          }
        }
      : {}),
    ...(normalized.eventTypes?.length ? { eventTypeCandidate: { in: normalized.eventTypes as never[] } } : {}),
    ...(normalized.hospitals?.length ? { primaryHospital: { in: normalized.hospitals } } : {})
  };
}

function startOfWeek(dateText: string) {
  const date = new Date(`${dateText}T00:00:00.000Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

function startOfMonth(dateText: string) {
  return `${dateText.slice(0, 7)}-01`;
}

function bucketDate(dateText: string, interval: CaseAnalyticsTrend["interval"]) {
  if (interval === "weekly") {
    return startOfWeek(dateText);
  }

  if (interval === "monthly") {
    return startOfMonth(dateText);
  }

  return dateText;
}

function toSortedEntries(record: Map<string, TrendPoint>) {
  return [...record.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export const caseAnalyticsRepository = {
  async getAnalyticsForUser(
    userId: string,
    isAdmin: boolean,
    filter?: CaseAnalyticsFilter
  ): Promise<CaseAnalyticsRepositoryResult> {
    const eventWhere = buildEventWhere(userId, isAdmin, filter);

    const [caseGroups, totalEvents, confirmedEvents, reviewRequiredEvents, typeGroups, hospitalGroups] = await Promise.all([
      prisma.eventAtom.groupBy({
        by: ["caseId"],
        where: eventWhere
      }),
      prisma.eventAtom.count({ where: eventWhere }),
      prisma.eventAtom.count({ where: { ...eventWhere, confirmed: true } }),
      prisma.eventAtom.count({ where: { ...eventWhere, requiresReview: true } }),
      prisma.eventAtom.groupBy({
        by: ["eventTypeCandidate"],
        where: eventWhere,
        _count: {
          _all: true
        }
      }),
      prisma.eventAtom.groupBy({
        by: ["primaryHospital"],
        where: eventWhere,
        _count: {
          _all: true
        }
      })
    ]);

    const eventsByHospital = hospitalGroups
      .filter((item) => item.primaryHospital)
      .map((item) => ({
        key: item.primaryHospital ?? "Unknown hospital",
        count: item._count._all
      }))
      .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));

    return {
      totalCases: caseGroups.length,
      totalEvents,
      confirmedEvents,
      unconfirmedEvents: Math.max(totalEvents - confirmedEvents, 0),
      reviewRequiredEvents,
      eventsByType: typeGroups.map((item) => ({
        key: item.eventTypeCandidate,
        count: item._count._all
      })),
      eventsByHospital,
      topHospitals: eventsByHospital.slice(0, 5).map((item) => ({
        hospital: item.key,
        events: item.count
      }))
    };
  },

  async getTopHospitalsForUser(
    userId: string,
    isAdmin: boolean,
    filter?: CaseAnalyticsFilter,
    limit = 5
  ): Promise<Array<{ hospital: string; events: number }>> {
    const eventWhere = buildEventWhere(userId, isAdmin, filter);
    const hospitalGroups = await prisma.eventAtom.groupBy({
      by: ["primaryHospital"],
      where: eventWhere,
      _count: {
        _all: true
      }
    });

    return hospitalGroups
      .filter((item) => item.primaryHospital)
      .map((item) => ({
        hospital: item.primaryHospital ?? "Unknown hospital",
        events: item._count._all
      }))
      .sort((left, right) => right.events - left.events || left.hospital.localeCompare(right.hospital))
      .slice(0, limit);
  },

  async getTrendForUser(
    userId: string,
    isAdmin: boolean,
    filter: CaseAnalyticsFilter,
    interval: CaseAnalyticsTrend["interval"]
  ): Promise<CaseAnalyticsTrend> {
    const eventWhere = buildEventWhere(userId, isAdmin, filter);
    const events = await prisma.eventAtom.findMany({
      where: eventWhere,
      select: {
        canonicalDate: true,
        confirmed: true
      },
      orderBy: {
        canonicalDate: "asc"
      }
    });

    const buckets = new Map<string, TrendPoint>();

    for (const event of events) {
      const bucket = bucketDate(event.canonicalDate, interval);
      const current = buckets.get(bucket) ?? {
        date: bucket,
        total: 0,
        confirmed: 0,
        unconfirmed: 0
      };

      current.total += 1;
      if (event.confirmed) {
        current.confirmed += 1;
      } else {
        current.unconfirmed += 1;
      }

      buckets.set(bucket, current);
    }

    return {
      interval,
      points: toSortedEntries(buckets)
    };
  }
};
