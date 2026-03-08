import { describe, expect, it } from "vitest";
import { getCaseList } from "./case-list-service";

describe("getCaseList", () => {
  it("maps and sorts case data for a standard user", async () => {
    const result = await getCaseList(
      "user-1",
      "consumer",
      {
        findCasesForUser: async () => [
          {
            id: "case-1",
            audience: "consumer",
            status: "ready",
            createdAt: new Date("2026-03-01T00:00:00.000Z"),
            patientInput: { insuranceCompany: "Seoul Hospital" },
            sourceDocuments: [{ uploadedAt: new Date("2026-03-06T09:00:00.000Z"), originalFileName: "doc-a.pdf" }],
            eventBundles: [{ primaryHospital: "Seoul Hospital" }],
            reports: [{ reportType: "consumer_summary", status: "ready" }]
          }
        ]
      }
    );

    expect(result.items[0]).toEqual({
      caseId: "case-1",
      hospitalName: "Seoul Hospital",
      uploadDate: "2026-03-06T09:00:00.000Z",
      status: "ready",
      audience: "consumer",
      hasReport: true,
      hasNarrative: true,
      hasPdf: true
    });
  });

  it("rejects unsupported roles", async () => {
    await expect(
      getCaseList("user-1", "guest" as never, {
        findCasesForUser: async () => []
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
