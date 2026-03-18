"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/app-shell";

const ADMIN_EMAIL = "nofnotg@gmail.com";

type LoginRole = "consumer" | "investigator";

export default function SignInPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<LoginRole>("consumer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const helperText = useMemo(() => {
    if (selectedRole === "investigator") {
      return "손해사정조사자는 승인된 계정으로 로그인하면 조사자용 결과와 검토 기능을 바로 확인할 수 있습니다.";
    }

    return "일반사용자는 이전 분석 목록과 케이스 분석 결과를 같은 계정으로 이어서 확인할 수 있습니다.";
  }, [selectedRole]);

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password
        })
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error((json as { error?: { message?: string } })?.error?.message ?? "로그인에 실패했습니다.");
      }

      router.push(normalizedEmail === ADMIN_EMAIL ? "/dashboard/admin" : "/dashboard");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell
      heading="로그인"
      subheading="가입 신청이 완료된 계정으로 로그인하면 이전 분석 목록, 케이스 분석, 결과 보고서를 계속 이어서 사용할 수 있습니다."
    >
      <div style={{ display: "grid", gap: "20px" }}>
        <form onSubmit={handleSignIn} style={panelStyle}>
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ fontSize: "14px", color: "var(--muted)" }}>로그인 유형 안내</div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" onClick={() => setSelectedRole("consumer")} style={segmentButtonStyle(selectedRole === "consumer")}>
                일반사용자
              </button>
              <button type="button" onClick={() => setSelectedRole("investigator")} style={segmentButtonStyle(selectedRole === "investigator")}>
                손해사정조사자
              </button>
            </div>
          </div>

          <label style={fieldStyle}>
            <span>이메일 (로그인 ID)</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
          </label>

          <label style={fieldStyle}>
            <span>비밀번호</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호 입력" />
          </label>

          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>{helperText}</p>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
            운영자 계정은 별도 박스가 아니라 지정된 관리자 이메일로 로그인할 때만 관리자 화면으로 이동합니다.
          </p>

          <button type="submit" disabled={isSubmitting} style={primaryButtonStyle}>
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>

          {status ? (
            <div role="status" style={{ color: "#8d2b22" }}>
              {status}
            </div>
          ) : null}
        </form>

        <div style={bottomInfoStyle}>
          <strong>처음 오셨나요?</strong>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
            일반사용자 가입 또는 손해사정조사자 신청을 먼저 진행한 뒤 로그인 화면으로 돌아와 주세요.
          </p>
          <Link href="/sign-up" style={ghostLinkStyle}>
            회원가입으로 이동
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

const panelStyle = {
  display: "grid",
  gap: "18px",
  maxWidth: "560px",
  padding: "24px",
  border: "1px solid rgba(62, 49, 31, 0.09)",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.92)"
} as const;

const bottomInfoStyle = {
  display: "grid",
  gap: "10px",
  maxWidth: "560px",
  padding: "18px 20px",
  border: "1px solid var(--border)",
  borderRadius: "20px",
  background: "#fffdf8"
} as const;

const fieldStyle = {
  display: "grid",
  gap: "8px"
} as const;

const primaryButtonStyle = {
  border: "1px solid var(--accent)",
  borderRadius: "999px",
  padding: "12px 16px",
  background: "var(--accent)",
  color: "var(--accent-foreground)",
  cursor: "pointer",
  fontWeight: 700
} as const;

function segmentButtonStyle(active: boolean) {
  return {
    border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
    borderRadius: "999px",
    padding: "10px 16px",
    background: active ? "rgba(196, 146, 74, 0.14)" : "var(--surface)",
    cursor: "pointer",
    fontWeight: 600
  } as const;
}

const ghostLinkStyle = {
  width: "fit-content",
  border: "1px solid var(--border)",
  borderRadius: "999px",
  padding: "10px 16px",
  textDecoration: "none",
  color: "inherit",
  fontWeight: 600
} as const;
