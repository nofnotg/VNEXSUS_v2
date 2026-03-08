import { prisma } from "../../prisma";

export type CaseAnalyticsRepositoryResult = {
  totalCases: number;
  totalEvents: number;
  confirmedEvents: number;
  unconfirmedEvents: number;
  reviewRequiredEvents: number;
  eventsByType: Array<{ key: string; count: number }>;
  eventsByHospital: Array<{ key: string; count: number }>;
};

export const caseAnalyticsRepository = {
  async getAnalyticsForUser(userId: string, isAdmin: boolean): Promise<CaseAnalyticsRepositoryResult> {
    const caseWhere = isAdmin ? {} : { ownerUserId: userId };
    const eventWhere = isAdmin ? {} : { case: { ownerUserId: userId } };

    const [
      totalCases,
      totalEvents,
      confirmedEvents,
      reviewRequiredEvents,
      typeGroups,
      hospitalGroups
    ] = await Promise.all([
      prisma.case.count({ where: caseWhere }),
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

    return {
      totalCases,
      totalEvents,
      confirmedEvents,
      unconfirmedEvents: Math.max(totalEvents - confirmedEvents, 0),
      reviewRequiredEvents,
      eventsByType: typeGroups.map((item) => ({
        key: item.eventTypeCandidate,
        count: item._count._all
      })),
      eventsByHospital: hospitalGroups
        .filter((item) => item.primaryHospital)
        .map((item) => ({
          key: item.primaryHospital ?? "Unknown hospital",
          count: item._count._all
        }))
    };
  }
};
