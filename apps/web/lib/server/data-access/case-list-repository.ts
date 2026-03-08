import { prisma } from "../../prisma";

export type CaseListRecord = {
  id: string;
  audience: "consumer" | "investigator";
  status: "draft" | "uploaded" | "processing" | "ready" | "review_required" | "archived";
  createdAt: Date;
  patientInput: {
    insuranceCompany: string | null;
  } | null;
  sourceDocuments: Array<{
    uploadedAt: Date;
    originalFileName: string;
  }>;
  eventBundles: Array<{
    primaryHospital: string | null;
  }>;
  reports: Array<{
    reportType: "consumer_summary" | "investigator_report";
    status: "draft" | "ready" | "failed";
  }>;
};

export const caseListRepository = {
  async findCasesForUser(userId: string, isAdmin: boolean): Promise<CaseListRecord[]> {
    return prisma.case.findMany({
      where: isAdmin ? {} : { ownerUserId: userId },
      orderBy: { updatedAt: "desc" },
      include: {
        patientInput: {
          select: {
            insuranceCompany: true
          }
        },
        sourceDocuments: {
          orderBy: { uploadedAt: "desc" },
          select: {
            uploadedAt: true,
            originalFileName: true
          }
        },
        eventBundles: {
          where: {
            primaryHospital: {
              not: null
            }
          },
          orderBy: { createdAt: "desc" },
          select: {
            primaryHospital: true
          }
        },
        reports: {
          select: {
            reportType: true,
            status: true
          }
        }
      }
    });
  }
};
