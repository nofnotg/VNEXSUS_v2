"use client";

import { useEffect, useMemo, useState } from "react";
import {
  consumerPlanCatalog,
  investigatorPlanCatalog,
  type PlanCode
} from "../../../lib/constants/plan-catalog";

type AdminAccessOverview = {
  pendingInvestigators: Array<{
    userId: string;
    email: string;
    displayName: string;
    phone: string;
    region: string;
    company: string;
    investigatorCode: string;
    requestedAt: string;
  }>;
  users: Array<{
    userId: string;
    email: string;
    displayName: string;
    role: "consumer" | "investigator" | "admin";
    status: "pending" | "active" | "suspended";
    verificationStatus: "not_requested" | "pending" | "approved" | "rejected";
    phone: string;
    region: string;
    currentPlanCode: string | null;
    currentPlanName: string | null;
  }>;
};

type AccessDraft = {
  status: "pending" | "active" | "suspended";
  planCode: PlanCode | "";
};

const statusOptions = [
  { value: "active", label: "접속 허용" },
  { value: "pending", label: "대기" },
  { value: "suspended", label: "접속 제한" }
] as const;

export function AdminDashboardClient() {
  const [data, setData] = useState<AdminAccessOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestPlanByUser, setRequestPlanByUser] = useState<Record<string, PlanCode>>({});
  const [accessDrafts, setAccessDrafts] = useState<Record<string, AccessDraft>>({});
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  async function loadOverview() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/access", {
        method: "GET",
        cache: "no-store"
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error((json as { error?: { message?: string } })?.error?.message ?? "운영자 정보를 불러오지 못했습니다.");
      }

      const nextData = (json as { data: AdminAccessOverview }).data;
      setData(nextData);
      setAccessDrafts(
        Object.fromEntries(
          nextData.users.map((user) => [
            user.userId,
            {
              status: user.status,
              planCode: (user.currentPlanCode as PlanCode | null) ?? ""
            }
          ])
        )
      );
      setRequestPlanByUser(
        Object.fromEntries(
          nextData.pendingInvestigators.map((user) => [user.userId, "investigator-starter" satisfies PlanCode])
        )
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "운영자 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  const summary = useMemo(() => {
    if (!data) {
      return null;
    }

    return {
      pendingRequests: data.pendingInvestigators.length,
      activeUsers: data.users.filter((user) => user.status === "active").length,
      blockedUsers: data.users.filter((user) => user.status === "suspended").length
    };
  }, [data]);

  async function reviewRequest(userId: string, decision: "approve" | "reject") {
    setBusyUserId(userId);

    try {
      const response = await fetch(`/api/admin/access/requests/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          planCode: decision === "approve" ? requestPlanByUser[userId] ?? "investigator-starter" : null
        })
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error((json as { error?: { message?: string } })?.error?.message ?? "승인 상태를 변경하지 못했습니다.");
      }

      await loadOverview();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "승인 상태를 변경하지 못했습니다.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function deleteRequest(userId: string) {
    setBusyUserId(userId);

    try {
      const response = await fetch(`/api/admin/access/requests/${userId}`, {
        method: "DELETE"
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error((json as { error?: { message?: string } })?.error?.message ?? "신청 요청을 삭제하지 못했습니다.");
      }

      await loadOverview();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "신청 요청을 삭제하지 못했습니다.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function updateUser(userId: string) {
    setBusyUserId(userId);

    try {
      const draft = accessDrafts[userId];

      if (!draft) {
        throw new Error("사용자 권한 상태가 준비되지 않았습니다.");
      }

      const response = await fetch(`/api/admin/access/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: draft.status,
          planCode: draft.planCode || null
        })
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error((json as { error?: { message?: string } })?.error?.message ?? "사용자 권한을 저장하지 못했습니다.");
      }

      await loadOverview();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "사용자 권한을 저장하지 못했습니다.");
    } finally {
      setBusyUserId(null);
    }
  }

  if (loading) {
    return <div style={emptyStateStyle}>운영자 정보를 불러오는 중입니다.</div>;
  }

  if (error) {
    return <div style={errorStyle}>{error}</div>;
  }

  if (!data || !summary) {
    return <div style={emptyStateStyle}>운영자 화면 데이터를 찾지 못했습니다.</div>;
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <section style={summaryGridStyle}>
        <article style={summaryCardStyle}>
          <div style={summaryLabelStyle}>승인 대기 조사자</div>
          <strong style={summaryValueStyle}>{summary.pendingRequests}</strong>
        </article>
        <article style={summaryCardStyle}>
          <div style={summaryLabelStyle}>현재 접속 허용 사용자</div>
          <strong style={summaryValueStyle}>{summary.activeUsers}</strong>
        </article>
        <article style={summaryCardStyle}>
          <div style={summaryLabelStyle}>접속 제한 사용자</div>
          <strong style={summaryValueStyle}>{summary.blockedUsers}</strong>
        </article>
      </section>

      <section style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>손해사정조사자 승인 요청</h2>
            <p style={sectionBodyStyle}>
              신청된 조사자 계정을 검토하고, 승인과 동시에 플랜을 부여하거나 반려할 수 있습니다.
            </p>
          </div>
        </div>

        {data.pendingInvestigators.length === 0 ? (
          <div style={emptyStateStyle}>현재 승인 대기 중인 조사자 요청이 없습니다.</div>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {data.pendingInvestigators.map((request) => (
              <article key={request.userId} style={requestCardStyle}>
                <div style={{ display: "grid", gap: "8px" }}>
                  <strong style={{ fontSize: "18px" }}>{request.displayName}</strong>
                  <div style={metaTextStyle}>이메일: {request.email}</div>
                  <div style={metaTextStyle}>연락처: {request.phone || "-"}</div>
                  <div style={metaTextStyle}>지역: {request.region || "-"}</div>
                  <div style={metaTextStyle}>회사명: {request.company || "-"}</div>
                  <div style={metaTextStyle}>조사자 코드: {request.investigatorCode || "-"}</div>
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  <label style={fieldStyle}>
                    <span>승인 시 부여할 플랜</span>
                    <select
                      value={requestPlanByUser[request.userId] ?? "investigator-starter"}
                      onChange={(event) =>
                        setRequestPlanByUser((current) => ({
                          ...current,
                          [request.userId]: event.target.value as PlanCode
                        }))
                      }
                    >
                      {investigatorPlanCatalog.map((plan) => (
                        <option key={plan.code} value={plan.code}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      style={primaryButtonStyle}
                      disabled={busyUserId === request.userId}
                      onClick={() => void reviewRequest(request.userId, "approve")}
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      style={dangerButtonStyle}
                      disabled={busyUserId === request.userId}
                      onClick={() => void reviewRequest(request.userId, "reject")}
                    >
                      반려
                    </button>
                    <button
                      type="button"
                      style={ghostDangerButtonStyle}
                      disabled={busyUserId === request.userId}
                      onClick={() => void deleteRequest(request.userId)}
                    >
                      요청 삭제
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>사용자 접속 제한 및 패킷 권한</h2>
            <p style={sectionBodyStyle}>
              일반사용자와 조사자의 접속 상태, 현재 플랜, 승인 상태를 한 번에 관리할 수 있습니다.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gap: "14px" }}>
          {data.users.map((user) => {
            const draft = accessDrafts[user.userId] ?? {
              status: user.status,
              planCode: (user.currentPlanCode as PlanCode | null) ?? ""
            };
            const planOptions = user.role === "investigator" ? investigatorPlanCatalog : consumerPlanCatalog;
            const isAdmin = user.role === "admin";

            return (
              <article key={user.userId} style={userCardStyle}>
                <div style={{ display: "grid", gap: "8px" }}>
                  <strong style={{ fontSize: "18px" }}>{user.displayName}</strong>
                  <div style={metaTextStyle}>이메일: {user.email}</div>
                  <div style={metaTextStyle}>역할: {user.role}</div>
                  <div style={metaTextStyle}>접속 상태: {user.status}</div>
                  <div style={metaTextStyle}>조사자 승인 상태: {user.verificationStatus}</div>
                  <div style={metaTextStyle}>현재 플랜: {user.currentPlanName ?? "미부여"}</div>
                </div>

                <div style={adminControlGridStyle}>
                  <label style={fieldStyle}>
                    <span>접속 상태</span>
                    <select
                      disabled={isAdmin}
                      value={draft.status}
                      onChange={(event) =>
                        setAccessDrafts((current) => ({
                          ...current,
                          [user.userId]: {
                            ...draft,
                            status: event.target.value as AccessDraft["status"]
                          }
                        }))
                      }
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={fieldStyle}>
                    <span>패킷 / 플랜 권한</span>
                    <select
                      disabled={isAdmin}
                      value={draft.planCode}
                      onChange={(event) =>
                        setAccessDrafts((current) => ({
                          ...current,
                          [user.userId]: {
                            ...draft,
                            planCode: event.target.value as AccessDraft["planCode"]
                          }
                        }))
                      }
                    >
                      <option value="">미부여</option>
                      {planOptions.map((plan) => (
                        <option key={plan.code} value={plan.code}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    style={secondaryButtonStyle}
                    disabled={isAdmin || busyUserId === user.userId}
                    onClick={() => void updateUser(user.userId)}
                  >
                    저장
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const summaryGridStyle = {
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
} as const;

const summaryCardStyle = {
  display: "grid",
  gap: "8px",
  padding: "22px",
  borderRadius: "22px",
  border: "1px solid rgba(62, 49, 31, 0.09)",
  background: "#fffdf8"
} as const;

const summaryLabelStyle = {
  color: "var(--muted)",
  fontSize: "14px"
} as const;

const summaryValueStyle = {
  fontSize: "30px"
} as const;

const cardStyle = {
  display: "grid",
  gap: "18px",
  padding: "24px",
  borderRadius: "24px",
  border: "1px solid rgba(62, 49, 31, 0.09)",
  background: "rgba(255,255,255,0.9)"
} as const;

const requestCardStyle = {
  display: "grid",
  gap: "18px",
  padding: "18px",
  borderRadius: "18px",
  border: "1px solid var(--border)",
  background: "#fffaf1",
  gridTemplateColumns: "minmax(0, 1.3fr) minmax(240px, 0.9fr)"
} as const;

const userCardStyle = {
  display: "grid",
  gap: "18px",
  padding: "18px",
  borderRadius: "18px",
  border: "1px solid var(--border)",
  background: "#ffffff",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(260px, 1fr)"
} as const;

const adminControlGridStyle = {
  display: "grid",
  gap: "12px",
  alignContent: "start"
} as const;

const sectionHeaderStyle = {
  display: "grid",
  gap: "8px"
} as const;

const sectionTitleStyle = {
  margin: 0,
  fontSize: "22px"
} as const;

const sectionBodyStyle = {
  margin: 0,
  color: "var(--muted)",
  lineHeight: 1.7
} as const;

const fieldStyle = {
  display: "grid",
  gap: "8px"
} as const;

const metaTextStyle = {
  color: "var(--muted)",
  lineHeight: 1.7
} as const;

const emptyStateStyle = {
  padding: "18px",
  borderRadius: "18px",
  border: "1px dashed var(--border)",
  color: "var(--muted)",
  background: "#fffdf8"
} as const;

const errorStyle = {
  padding: "18px",
  borderRadius: "18px",
  border: "1px solid rgba(141, 43, 34, 0.2)",
  color: "#8d2b22",
  background: "#fff5f3"
} as const;

const primaryButtonStyle = {
  border: "1px solid var(--accent)",
  borderRadius: "999px",
  padding: "11px 16px",
  background: "var(--accent)",
  color: "var(--accent-foreground)",
  cursor: "pointer",
  fontWeight: 700
} as const;

const secondaryButtonStyle = {
  border: "1px solid var(--border)",
  borderRadius: "999px",
  padding: "11px 16px",
  background: "var(--surface)",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 600
} as const;

const dangerButtonStyle = {
  border: "1px solid rgba(141, 43, 34, 0.2)",
  borderRadius: "999px",
  padding: "11px 16px",
  background: "#fff1ee",
  color: "#8d2b22",
  cursor: "pointer",
  fontWeight: 700
} as const;

const ghostDangerButtonStyle = {
  border: "1px solid rgba(141, 43, 34, 0.2)",
  borderRadius: "999px",
  padding: "11px 16px",
  background: "#ffffff",
  color: "#8d2b22",
  cursor: "pointer",
  fontWeight: 700
} as const;
