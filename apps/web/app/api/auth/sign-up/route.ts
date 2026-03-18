import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiError, createApiSuccess, userRoles } from "@vnexus/shared";
import { prisma } from "../../../../lib/prisma";
import { hashPassword } from "../../../../lib/server/auth/password";

const ADMIN_EMAIL = "nofnotg@gmail.com";

const signUpSchema = z
  .object({
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    passwordConfirm: z.string().min(8),
    region: z.string().optional(),
    ageBand: z.string().optional(),
    referrerId: z.string().optional(),
    company: z.string().optional(),
    investigatorCode: z.string().optional(),
    role: z.enum(userRoles)
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passwordConfirm"],
        message: "Password confirmation does not match."
      });
    }
  });

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = signUpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(createApiError("VALIDATION_ERROR", "Invalid sign-up payload"), {
      status: 400
    });
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail
    },
    select: {
      id: true
    }
  });

  if (existingUser) {
    return NextResponse.json(createApiError("CONFLICT", "Email is already in use"), {
      status: 409
    });
  }

  const nextRole = normalizedEmail === ADMIN_EMAIL ? "admin" : parsed.data.role;
  const nextStatus = nextRole === "investigator" ? "pending" : "active";
  const verificationStatus =
    nextRole === "investigator" ? "pending" : nextRole === "admin" ? "approved" : "not_requested";
  const roleDetail = JSON.stringify({
    region: parsed.data.region?.trim() ?? "",
    ageBand: parsed.data.ageBand?.trim() ?? "",
    referrerId: parsed.data.referrerId?.trim() ?? "",
    company: parsed.data.company?.trim() ?? "",
    investigatorCode: parsed.data.investigatorCode?.trim() ?? ""
  });

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: hashPassword(parsed.data.password),
      role: nextRole,
      status: nextStatus,
      profile: {
        create: {
          displayName: parsed.data.name.trim(),
          phone: parsed.data.phone.trim(),
          locale: "ko",
          theme: "light",
          roleDetail,
          investigatorVerificationStatus: verificationStatus
        }
      }
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true
    }
  });

  return NextResponse.json(
    createApiSuccess({
      user,
      message:
        nextRole === "investigator"
          ? "Investigator signup request received. Approval is required before login."
          : "Signup completed successfully."
    }),
    { status: 201 }
  );
}
