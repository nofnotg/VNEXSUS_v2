import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma";

export type CaseDetailRecord = {
  id: string;
  ownerUserId: string;
  audience: "consumer" | "investigator";
  patientInput: {
    insuranceCompany: string | null;
  } | null;
  eventAtoms: Array<{
    id: string;
    eventBundleId: string | null;
    canonicalDate: string;
    fileOrder: number;
    pageOrder: number;
    anchorBlockIndex: number;
    primaryHospital: string | null;
    primaryDepartment: string | null;
    primaryDiagnosis: string | null;
    primaryTest: string | null;
    primaryTreatment: string | null;
    primaryProcedure: string | null;
    primarySurgery: string | null;
    admissionStatus: string | null;
    pathologySummary: string | null;
    medicationSummary: string | null;
    symptomSummary: string | null;
    eventTypeCandidate:
      | "outpatient"
      | "exam"
      | "treatment"
      | "procedure"
      | "surgery"
      | "admission"
      | "discharge"
      | "pathology"
      | "followup"
      | "mixed"
      | "unknown";
    confirmed: boolean;
    editedAt: Date | null;
    editHistory: unknown;
    requiresReview: boolean;
    sourceFileId: string;
    sourcePageId: string;
  }>;
};

export const caseDetailRepository = {
  async findCaseDetail(caseId: string, userId: string, isAdmin: boolean): Promise<CaseDetailRecord | null> {
    return prisma.case.findFirst({
      where: isAdmin ? { id: caseId } : { id: caseId, ownerUserId: userId },
      select: {
        id: true,
        ownerUserId: true,
        audience: true,
        patientInput: {
          select: {
            insuranceCompany: true
          }
        },
        eventAtoms: {
          orderBy: [{ canonicalDate: "asc" }, { fileOrder: "asc" }, { pageOrder: "asc" }, { anchorBlockIndex: "asc" }],
          select: {
            id: true,
            eventBundleId: true,
            canonicalDate: true,
            fileOrder: true,
            pageOrder: true,
            anchorBlockIndex: true,
            primaryHospital: true,
            primaryDepartment: true,
            primaryDiagnosis: true,
            primaryTest: true,
            primaryTreatment: true,
            primaryProcedure: true,
            primarySurgery: true,
            admissionStatus: true,
            pathologySummary: true,
            medicationSummary: true,
            symptomSummary: true,
            eventTypeCandidate: true,
            confirmed: true,
            editedAt: true,
            editHistory: true,
            requiresReview: true,
            sourceFileId: true,
            sourcePageId: true
          }
        }
      }
    });
  },

  async updateEventConfirmation(eventId: string, confirmed: boolean) {
    return prisma.eventAtom.update({
      where: { id: eventId },
      data: { confirmed },
      select: {
        id: true,
        confirmed: true
      }
    });
  },

  async updateEventDetails(
    eventId: string,
    data: {
      canonicalDate?: string;
      primaryHospital?: string;
      requiresReview?: boolean;
      editedAt: Date;
      editHistory: Prisma.InputJsonValue;
    }
  ): Promise<{ id: string }> {
    return prisma.eventAtom.update({
      where: { id: eventId },
      data,
      select: {
        id: true
      }
    });
  }
};
