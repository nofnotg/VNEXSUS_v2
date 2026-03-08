import { describe, expect, it } from "vitest";
import { getCaseAnalytics, getCaseAnalyticsTrend } from "./case-analytics-service";

describe("case analytics service", () => {
  it("aggregates and validates analytics data for investigators", async () => {
    const result = await getCaseAnalytics("user-1", "investigator", { startDate: "2026-01-01", endDate: "2026-01-31" }, {
      getAnalyticsForUser: async (_userId, _isAdmin, filter) => {
        expect(filter).toEqual({
          startDate: "2026-01-01",
          endDate: "2026-01-31"
        });

        return {
          totalCases: 3,
          totalEvents: 8,
          confirmedEvents: 5,
          unconfirmedEvents: 3,
          reviewRequiredEvents: 2,
          eventsByType: [
            { key: "exam", count: 4 },
            { key: "outpatient", count: 3 },
            { key: "surgery", count: 1 }
          ],
          eventsByHospital: [
            { key: "Seoul Hospital", count: 5 },
            { key: "Busan Hospital", count: 2 }
          ]
        };
      },
      getTrendForUser: async () => ({
        interval: "daily",
        points: []
      })
    });

    expect(result).toEqual({
      totalCases: 3,
      totalEvents: 8,
      confirmedEvents: 5,
      unconfirmedEvents: 3,
      reviewRequiredEvents: 2,
      eventsByType: {
        exam: 4,
        outpatient: 3,
        surgery: 1
      },
      eventsByHospital: {
        "Seoul Hospital": 5,
        "Busan Hospital": 2
      }
    });
  });

  it("builds trend data for admins", async () => {
    const result = await getCaseAnalyticsTrend(
      "admin-1",
      "admin",
      { eventTypes: ["exam"], hospitals: ["Seoul Hospital"] },
      "weekly",
      {
        getAnalyticsForUser: async () => ({
          totalCases: 0,
          totalEvents: 0,
          confirmedEvents: 0,
          unconfirmedEvents: 0,
          reviewRequiredEvents: 0,
          eventsByType: [],
          eventsByHospital: []
        }),
        getTrendForUser: async (_userId, isAdmin, filter, interval) => {
          expect(isAdmin).toBe(true);
          expect(filter).toEqual({
            eventTypes: ["exam"],
            hospitals: ["Seoul Hospital"]
          });
          expect(interval).toBe("weekly");

          return {
            interval: "weekly",
            points: [
              { date: "2026-01-05", total: 4, confirmed: 3, unconfirmed: 1 },
              { date: "2026-01-12", total: 2, confirmed: 1, unconfirmed: 1 }
            ]
          };
        }
      }
    );

    expect(result.points).toHaveLength(2);
    expect(result.points[0]?.confirmed).toBe(3);
  });

  it("rejects consumer access", async () => {
    await expect(
      getCaseAnalytics(
        "user-1",
        "consumer",
        {},
        {
          getAnalyticsForUser: async () => ({
            totalCases: 0,
            totalEvents: 0,
            confirmedEvents: 0,
            unconfirmedEvents: 0,
            reviewRequiredEvents: 0,
            eventsByType: [],
            eventsByHospital: []
          }),
          getTrendForUser: async () => ({
            interval: "daily",
            points: []
          })
        }
      )
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
