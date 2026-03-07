import { Prisma } from "@prisma/client";
import { ApiError, CaseCreateInput, CaseUpdateInput, PatientInput, UserRole } from "@vnexus/shared";
import { prisma } from "../../prisma";

function buildCaseAccessWhere(caseId: string, userId: string, role: UserRole) {
  if (role === "admin") {
    return { id: caseId };
  }

  return {
    id: caseId,
    ownerUserId: userId
  };
}

export async function listCasesForUser(userId: string, role: UserRole) {
  return prisma.case.findMany({
    where: role === "admin" ? {} : { ownerUserId: userId },
    orderBy: { updatedAt: "desc" },
    include: {
      patientInput: true,
      sourceDocuments: {
        orderBy: { fileOrder: "asc" }
      }
    }
  });
}

export async function createCaseForUser(userId: string, input: CaseCreateInput) {
  return prisma.case.create({
    data: {
      ownerUserId: userId,
      title: input.title,
      audience: input.audience
    }
  });
}

export async function getCaseForUser(caseId: string, userId: string, role: UserRole) {
  const item = await prisma.case.findFirst({
    where: buildCaseAccessWhere(caseId, userId, role),
    include: {
      patientInput: true,
      sourceDocuments: {
        orderBy: { fileOrder: "asc" }
      },
      analysisJobs: {
        orderBy: [{ startedAt: "desc" }, { id: "desc" }]
      }
    }
  });

  if (!item) {
    throw new ApiError("NOT_FOUND", "Case not found");
  }

  return item;
}

export async function updateCaseForUser(caseId: string, userId: string, role: UserRole, input: CaseUpdateInput) {
  await getCaseForUser(caseId, userId, role);

  const updateData: Prisma.CaseUpdateInput = {};

  if (input.title !== undefined) {
    updateData.title = input.title;
  }

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  return prisma.case.update({
    where: { id: caseId },
    data: updateData
  });
}

export async function deleteCaseForUser(caseId: string, userId: string, role: UserRole) {
  await getCaseForUser(caseId, userId, role);

  await prisma.case.delete({
    where: { id: caseId }
  });

  return { deleted: true };
}

export async function upsertPatientInput(caseId: string, userId: string, role: UserRole, input: PatientInput) {
  await getCaseForUser(caseId, userId, role);

  return prisma.casePatientInput.upsert({
    where: { caseId },
    update: {
      patientName: input.patientName,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
      insuranceJoinDate: new Date(input.insuranceJoinDate),
      insuranceCompany: input.insuranceCompany ?? null,
      productType: input.productType ?? null,
      inputSnapshotJson: input
    },
    create: {
      caseId,
      patientName: input.patientName,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
      insuranceJoinDate: new Date(input.insuranceJoinDate),
      insuranceCompany: input.insuranceCompany ?? null,
      productType: input.productType ?? null,
      inputSnapshotJson: input
    }
  });
}
