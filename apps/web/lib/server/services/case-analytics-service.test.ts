import { describe, expect, it } from "vitest";
import { getCaseAnalytics } from "./case-analytics-service";

describe("case analytics service", () => {
  it("aggregates and validates analytics data for investigators", async () => {
    const result = await getCaseAnalytics("user-1", "investigator", {
      getAnalyticsForUser: async () => ({
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

  it("rejects consumer access", async () => {
    await expect(
      getCaseAnalytics("user-1", "consumer", {
        getAnalyticsForUser: async () => ({
          totalCases: 0,
          totalEvents: 0,
          confirmedEvents: 0,
          unconfirmedEvents: 0,
          reviewRequiredEvents: 0,
          eventsByType: [],
          eventsByHospital: []
        })
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
