import { describe, expect, it } from "vitest";
import { getCaseDetail, updateEventConfirmation } from "./case-detail-service";

describe("case detail service", () => {
  it("builds a validated case timeline from persisted atoms", async () => {
    const result = await getCaseDetail(
      "case-1",
      "user-1",
      "consumer",
      {
        findCaseDetail: async () => ({
          id: "case-1",
          ownerUserId: "user-1",
          audience: "consumer",
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
              eventTypeCandidate: "exam",
              confirmed: true,
              requiresReview: false,
              sourceFileId: "doc-1",
              sourcePageId: "page-2"
            }
          ]
        })
      }
    );

    expect(result).toEqual({
      caseId: "case-1",
      hospitalName: "Seoul Hospital",
      events: [
        {
          eventId: "event-1",
          type: "exam",
          date: "2026-03-05",
          hospital: "Seoul Hospital",
          details: "Department: Pulmonology | Pneumonia | Chest CT | Antibiotics started | Cough",
          confirmed: true,
          requiresReview: false,
          metadata: {
            fileOrder: 1,
            pageOrder: 2,
            anchorBlockIndex: 4,
            eventBundleId: "bundle-1",
            sourceFileId: "doc-1",
            sourcePageId: "page-2"
          }
        }
      ]
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

    await updateEventConfirmation(
      "case-1",
      "event-1",
      true,
      "user-1",
      "investigator",
      {
        findCaseDetail: async () => ({
          id: "case-1",
          ownerUserId: "user-1",
          audience: "investigator",
          patientInput: null,
          eventAtoms: [
            {
              id: "event-1",
              eventBundleId: null,
              canonicalDate: "2026-03-05",
              fileOrder: 1,
              pageOrder: 1,
              anchorBlockIndex: 0,
              primaryHospital: "Seoul Hospital",
              primaryDepartment: null,
              primaryDiagnosis: null,
              primaryTest: null,
              primaryTreatment: null,
              primaryProcedure: null,
              primarySurgery: null,
              admissionStatus: null,
              pathologySummary: null,
              medicationSummary: null,
              symptomSummary: null,
              eventTypeCandidate: "outpatient",
              confirmed: false,
              requiresReview: false,
              sourceFileId: "doc-1",
              sourcePageId: "page-1"
            }
          ]
        }),
        updateEventConfirmation: async (_eventId, confirmed) => {
          persistedValue = confirmed;
          return { id: "event-1", confirmed };
        }
      }
    );

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
});
