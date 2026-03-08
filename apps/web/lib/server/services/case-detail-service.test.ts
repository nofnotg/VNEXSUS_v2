import { describe, expect, it, vi } from "vitest";
import type { CaseDetailRecord } from "../data-access/case-detail-repository";
import { getCaseDetail, updateEventConfirmation, updateEventDetails } from "./case-detail-service";

function buildRecord(): CaseDetailRecord {
  return {
    id: "case-1",
    ownerUserId: "user-1",
    audience: "investigator" as const,
    patientInput: {
      insuranceCompany: "Seoul Hospital"
    },
    eventAtoms: [
      {
        id: "event-1",
        eventBundleId: "bundle-1",
        canonicalDate: "2026-03-05",
        fileOrder: 1,
        pageOrder: 2,
        anchorBlockIndex: 4,
        primaryHospital: "Seoul Hospital",
        primaryDepartment: "Pulmonology",
        primaryDiagnosis: "Pneumonia",
        primaryTest: "Chest CT",
        primaryTreatment: null,
        primaryProcedure: null,
        primarySurgery: null,
        admissionStatus: null,
        pathologySummary: null,
        medicationSummary: "Antibiotics started",
        symptomSummary: "Cough",
        eventTypeCandidate: "exam" as const,
        confirmed: true,
        editedAt: null,
        editHistory: null,
        requiresReview: false,
        sourceFileId: "doc-1",
        sourcePageId: "page-2"
      }
    ]
  };
}

describe("case detail service", () => {
  it("builds a validated case timeline from persisted atoms", async () => {
    const result = await getCaseDetail("case-1", "user-1", "consumer", {
      findCaseDetail: async () => buildRecord()
    });

    expect(result.events[0]).toMatchObject({
      eventId: "event-1",
      type: "exam",
      date: "2026-03-05",
      hospital: "Seoul Hospital",
      details: "Department: Pulmonology | Pneumonia | Chest CT | Antibiotics started | Cough",
      confirmed: true,
      requiresReview: false
    });
  });

  it("rejects unsupported roles when reading detail", async () => {
    await expect(
      getCaseDetail("case-1", "user-1", "guest" as never, {
        findCaseDetail: async () => null
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows investigators to update confirmation state", async () => {
    let persistedValue = false;

    await updateEventConfirmation("case-1", "event-1", true, "user-1", "investigator", {
      findCaseDetail: async () => buildRecord(),
      updateEventConfirmation: async (_eventId, confirmed) => {
        persistedValue = confirmed;
        return { id: "event-1", confirmed };
      }
    });

    expect(persistedValue).toBe(true);
  });

  it("blocks consumer confirmation updates", async () => {
    await expect(
      updateEventConfirmation("case-1", "event-1", true, "user-1", "consumer", {
        findCaseDetail: async () => null,
        updateEventConfirmation: async () => ({ id: "event-1", confirmed: true })
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("updates event details and appends edit history", async () => {
    const updateEventDetailsMock = vi.fn(async () => ({ id: "event-1" }));

    const result = await updateEventDetails(
      "case-1",
      "user-1",
      "investigator",
      {
        eventId: "event-1",
        date: "2026-03-06",
        hospital: "Busan Hospital",
        details: "Revised detail",
        requiresReview: true
      },
      null,
      {
        findCaseDetail: async () => buildRecord(),
          updateEventDetails: updateEventDetailsMock
        }
      );

    expect(result).toMatchObject({
      eventId: "event-1",
      date: "2026-03-06",
      hospital: "Busan Hospital",
      details: "Revised detail",
      requiresReview: true
    });
    expect(result.editHistory).toHaveLength(1);
    expect(result.editHistory?.[0]?.editedBy).toBe("user-1");
    expect(result.editHistory?.[0]?.changes.details).toEqual({
      previousValue: "Department: Pulmonology | Pneumonia | Chest CT | Antibiotics started | Cough",
      nextValue: "Revised detail"
    });
    expect(updateEventDetailsMock).toHaveBeenCalledOnce();
  });

  it("rejects stale edit timestamps", async () => {
    const baseRecord = buildRecord();
    const baseEvent = baseRecord.eventAtoms[0];

    if (!baseEvent) {
      throw new Error("Expected base event fixture");
    }

    await expect(
      updateEventDetails(
        "case-1",
        "user-1",
        "investigator",
        {
          eventId: "event-1",
          details: "Revised detail"
        },
        "2026-03-05T00:00:00.000Z",
        {
          findCaseDetail: async () => ({
            ...baseRecord,
            eventAtoms: [{ ...baseEvent, editedAt: new Date("2026-03-05T01:00:00.000Z") }]
          }),
          updateEventDetails: async () => ({ id: "event-1" })
        }
      )
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
