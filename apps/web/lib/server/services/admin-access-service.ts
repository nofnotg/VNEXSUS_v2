import type { SubscriptionStatus } from "@prisma/client";
import { ApiError, type UserRole, type UserStatus } from "@vnexus/shared";
import { fullPlanCatalog, getPlansForRole, type PlanCode } from "../../constants/plan-catalog";
import { prisma } from "../../prisma";

export type AdminAccessOverview = {
  pendingInvestigators: PendingInvestigatorRequest[];
  users: ManagedUser[];
  availablePlans: typeof fullPlanCatalog;
};

export type PendingInvestigatorRequest = {
  userId: string;
  email: string;
  displayName: string;
  phone: string;
  region: string;
  company: string;
  investigatorCode: string;
  requestedAt: string;
};

export type ManagedUser = {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  verificationStatus: "not_requested" | "pending" | "approved" | "rejected";
  phone: string;
  region: string;
  currentPlanCode: string | null;
  currentPlanName: string | null;
  currentPlanBillingType: "one_time" | "credit" | "subscription" | null;
  currentPlanAccessModel: "packet" | "subscription" | null;
};

function parseRoleDetail(raw: string | null | undefined) {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

async function ensurePlanCatalog() {
  await Promise.all(
    fullPlanCatalog.map((plan) =>
      prisma.plan.upsert({
        where: { code: plan.code },
        update: {
          name: plan.name,
          audience: plan.audience,
          billingType: plan.billingType,
          isActive: true
        },
        create: {
          code: plan.code,
          name: plan.name,
          audience: plan.audience,
          billingType: plan.billingType,
          isActive: true
        }
      })
    )
  );
}

function pickCurrentSubscription(
  subscriptions: Array<{
    status: SubscriptionStatus;
    startedAt: Date | null;
    plan: {
      code: string;
      name: string;
    };
  }>
) {
  return [...subscriptions]
    .sort((left, right) => (right.startedAt?.getTime() ?? 0) - (left.startedAt?.getTime() ?? 0))
    .find((entry) => entry.status === "active" || entry.status === "trialing");
}

function normalizeManagedUser(record: {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  profile: {
    displayName: string | null;
    phone: string | null;
    roleDetail: string | null;
    investigatorVerificationStatus: "not_requested" | "pending" | "approved" | "rejected";
  } | null;
  subscriptions: Array<{
    status: SubscriptionStatus;
    startedAt: Date | null;
    plan: {
      code: string;
      name: string;
    };
  }>;
}): ManagedUser {
  const roleDetail = parseRoleDetail(record.profile?.roleDetail);
  const currentSubscription = pickCurrentSubscription(record.subscriptions);

  return {
    userId: record.id,
    email: record.email,
    displayName: record.profile?.displayName?.trim() || record.email.split("@")[0] || "사용자",
    role: record.role,
    status: record.status,
    verificationStatus: record.profile?.investigatorVerificationStatus ?? "not_requested",
    phone: record.profile?.phone?.trim() ?? "",
    region: typeof roleDetail.region === "string" ? roleDetail.region : "",
    currentPlanCode: currentSubscription?.plan.code ?? null,
    currentPlanName: currentSubscription?.plan.name ?? null,
    currentPlanBillingType: currentSubscription?.plan.code
      ? fullPlanCatalog.find((plan) => plan.code === currentSubscription.plan.code)?.billingType ?? null
      : null,
    currentPlanAccessModel: currentSubscription?.plan.code
      ? fullPlanCatalog.find((plan) => plan.code === currentSubscription.plan.code)?.accessModel ?? null
      : null
  };
}

export async function getAdminAccessOverview(): Promise<AdminAccessOverview> {
  await ensurePlanCatalog();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      profile: {
        select: {
          displayName: true,
          phone: true,
          roleDetail: true,
          investigatorVerificationStatus: true
        }
      },
      subscriptions: {
        orderBy: { startedAt: "desc" },
        select: {
          status: true,
          startedAt: true,
          plan: {
            select: {
              code: true,
              name: true
            }
          }
        }
      }
    }
  });

  const pendingInvestigators = users
    .filter((user) => user.role === "investigator" && user.profile?.investigatorVerificationStatus === "pending")
    .map((user) => {
      const roleDetail = parseRoleDetail(user.profile?.roleDetail);
      return {
        userId: user.id,
        email: user.email,
        displayName: user.profile?.displayName?.trim() || user.email.split("@")[0] || "사용자",
        phone: user.profile?.phone?.trim() ?? "",
        region: typeof roleDetail.region === "string" ? roleDetail.region : "",
        company: typeof roleDetail.company === "string" ? roleDetail.company : "",
        investigatorCode: typeof roleDetail.investigatorCode === "string" ? roleDetail.investigatorCode : "",
        requestedAt: user.createdAt.toISOString()
      };
    });

  return {
    pendingInvestigators,
    users: users.map(normalizeManagedUser),
    availablePlans: fullPlanCatalog
  };
}

async function assignPlan(userId: string, role: UserRole, planCode: PlanCode | null) {
  await ensurePlanCatalog();

  await prisma.subscription.updateMany({
    where: {
      userId,
      status: { in: ["active", "trialing", "past_due"] }
    },
    data: {
      status: "canceled",
      endsAt: new Date()
    }
  });

  if (!planCode) {
    return;
  }

  const allowedPlans = getPlansForRole(role);
  const selectedPlan = allowedPlans.find((plan) => plan.code === planCode);

  if (!selectedPlan) {
    throw new ApiError("VALIDATION_ERROR", "선택한 플랜이 현재 사용자 역할과 맞지 않습니다.");
  }

  const plan = await prisma.plan.findUnique({
    where: { code: selectedPlan.code },
    select: { id: true }
  });

  if (!plan) {
    throw new ApiError("NOT_FOUND", "플랜 정보를 찾을 수 없습니다.");
  }

  await prisma.subscription.create({
    data: {
      userId,
      planId: plan.id,
      status: "active",
      startedAt: new Date()
    }
  });
}

export async function reviewInvestigatorRequest(input: {
  userId: string;
  decision: "approve" | "reject";
  planCode?: PlanCode | null;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      role: true
    }
  });

  if (!user || user.role !== "investigator") {
    throw new ApiError("NOT_FOUND", "조사자 요청 계정을 찾을 수 없습니다.");
  }

  if (input.decision === "approve") {
    await prisma.user.update({
      where: { id: input.userId },
      data: {
        status: "active",
        profile: {
          upsert: {
            update: {
              investigatorVerificationStatus: "approved"
            },
            create: {
              investigatorVerificationStatus: "approved"
            }
          }
        }
      }
    });

    await assignPlan(input.userId, "investigator", input.planCode ?? "investigator-starter");
    return;
  }

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      status: "suspended",
      profile: {
        upsert: {
          update: {
            investigatorVerificationStatus: "rejected"
          },
          create: {
            investigatorVerificationStatus: "rejected"
          }
        }
      }
    }
  });

  await assignPlan(input.userId, "investigator", null);
}

export async function deletePendingInvestigatorRequest(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      profile: {
        select: {
          investigatorVerificationStatus: true
        }
      }
    }
  });

  if (!user || user.role !== "investigator") {
    throw new ApiError("NOT_FOUND", "삭제할 조사자 신청 계정을 찾을 수 없습니다.");
  }

  if (user.profile?.investigatorVerificationStatus !== "pending") {
    throw new ApiError("VALIDATION_ERROR", "승인 대기 상태의 조사자 신청만 삭제할 수 있습니다.");
  }

  await prisma.user.delete({
    where: { id: userId }
  });
}

export async function updateManagedUserAccess(input: {
  userId: string;
  status?: UserStatus;
  planCode?: PlanCode | null;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      role: true
    }
  });

  if (!user) {
    throw new ApiError("NOT_FOUND", "사용자 정보를 찾을 수 없습니다.");
  }

  if (user.role === "admin") {
    throw new ApiError("FORBIDDEN", "관리자 계정은 이 화면에서 변경할 수 없습니다.");
  }

  if (input.status !== undefined) {
    await prisma.user.update({
      where: { id: input.userId },
      data: { status: input.status }
    });
  }

  if (input.planCode !== undefined) {
    await assignPlan(input.userId, user.role, input.planCode);
  }
}

export async function deleteManagedUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true
    }
  });

  if (!user) {
    throw new ApiError("NOT_FOUND", "?ъ슜???뺣낫瑜?李얠쓣 ???놁뒿?덈떎.");
  }

  if (user.role === "admin") {
    throw new ApiError("FORBIDDEN", "愿由ъ옄 怨꾩젙???쒓굅??紐삵빀?덈떎.");
  }

  if (user.status !== "suspended") {
    throw new ApiError("VALIDATION_ERROR", "?쒖쇅 紐⑸줉?쇱뿉 ?덈뒗 ?ъ슜?먯뿉寃뚮쭔 ??젣瑜??덉슜?⑸땲??");
  }

  await prisma.user.delete({
    where: { id: userId }
  });
}
