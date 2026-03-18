"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { ageBandOptions, regionOptions } from "../../lib/constants/region-options";

type SignupMode = "consumer" | "investigator";

type EmailCheckState =
  | { status: "idle"; message: string | null }
  | { status: "checking"; message: string | null }
  | { status: "available"; message: string }
  | { status: "duplicate"; message: string }
  | { status: "error"; message: string };

export default function SignUpPage() {
  const [mode, setMode] = useState<SignupMode>("consumer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [ageBand, setAgeBand] = useState("");
  const [region, setRegion] = useState("");
  const [referrerId, setReferrerId] = useState("");
  const [company, setCompany] = useState("");
  const [investigatorCode, setInvestigatorCode] = useState("");
  const [agreements, setAgreements] = useState({
    privacy: false,
    legal: false,
    deleteNotice: false
  });
  const [emailCheck, setEmailCheck] = useState<EmailCheckState>({ status: "idle", message: null });
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMatch = password.length >= 8 && password === passwordConfirm;
  const canSubmit =
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    email.trim().length > 0 &&
    emailCheck.status === "available" &&
    passwordsMatch &&
    agreements.privacy &&
    agreements.legal &&
    agreements.deleteNotice &&
    (mode === "consumer" || (company.trim().length > 0 && investigatorCode.trim().length > 0));

  const roleNotice = useMemo(() => {
    if (mode === "investigator") {
      return "손해사정조사자는 회사명과 조사자코드를 제출하면 별도 승인 후 가입이 처리됩니다.";
    }

    return "일반사용자는 필수 정보와 동의 항목을 완료하면 바로 가입 신청을 보낼 수 있습니다.";
  }, [mode]);

  async function handleEmailCheck() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setEmailCheck({ status: "error", message: "이메일(로그인 ID)을 먼저 입력해 주세요." });
      return;
    }

    setEmailCheck({ status: "checking", message: "중복 여부를 확인하고 있습니다." });

    try {
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(normalizedEmail)}`, {
        method: "GET",
        cache: "no-store"
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error((json as { error?: { message?: string } })?.error?.message ?? "중복 확인에 실패했습니다.");
      }

      const available = Boolean((json as { data?: { available?: boolean } })?.data?.available);
      setEmailCheck(
        available
          ? { status: "available", message: "사용 가능한 로그인 ID입니다." }
          : { status: "duplicate", message: "이미 사용 중인 로그인 ID입니다." }
      );
    } catch (error) {
      setEmailCheck({
        status: "error",
        message: error instanceof Error ? error.message : "중복 확인에 실패했습니다."
      });
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setStatus("필수 정보, 중복 체크, 동의 항목을 모두 확인해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const signUpResponse = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          password,
          passwordConfirm,
          region,
          ageBand,
          referrerId,
          company,
          investigatorCode,
          role: mode
        })
      });

      const json = await signUpResponse.json().catch(() => null);

      if (!signUpResponse.ok) {
        throw new Error((json as { error?: { message?: string } })?.error?.message ?? "회원가입 요청을 처리하지 못했습니다.");
      }

      setStatus(
        mode === "consumer"
          ? "가입 신청이 완료되었습니다. 하단 버튼으로 로그인 화면으로 이동해 주세요."
          : "손해사정조사자 신청이 접수되었습니다. 별도 승인 후 로그인할 수 있습니다."
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "회원가입 요청을 처리하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell
      heading="회원가입"
      subheading="일반사용자와 손해사정조사자의 가입 흐름을 분리하고, 필수 정보와 동의 항목을 먼저 확인하도록 구성했습니다."
    >
      <div style={{ display: "grid", gap: "20px" }}>
        <form onSubmit={handleSubmit} style={panelStyle}>
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ fontSize: "14px", color: "var(--muted)" }}>가입 유형</div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" onClick={() => setMode("consumer")} style={segmentButtonStyle(mode === "consumer")}>
                일반사용자
              </button>
              <button type="button" onClick={() => setMode("investigator")} style={segmentButtonStyle(mode === "investigator")}>
                손해사정조사자 신청
              </button>
            </div>
            <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>{roleNotice}</p>
          </div>

          <div style={fieldStyle}>
            <span>이메일 (로그인 ID) *</span>
            <div style={emailRowStyle}>
              <input
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailCheck({ status: "idle", message: null });
                }}
                placeholder="name@example.com"
              />
              <button type="button" onClick={() => void handleEmailCheck()} style={secondaryButtonStyle}>
                중복체크
              </button>
            </div>
            {emailCheck.message ? (
              <small style={{ color: emailCheck.status === "duplicate" || emailCheck.status === "error" ? "#8d2b22" : "var(--muted)" }}>
                {emailCheck.message}
              </small>
            ) : null}
          </div>

          <div style={twoColumnGridStyle}>
            <label style={fieldStyle}>
              <span>비밀번호 *</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8자 이상" />
            </label>
            <label style={fieldStyle}>
              <span>비밀번호 확인 *</span>
              <input type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} placeholder="비밀번호를 다시 입력" />
            </label>
          </div>

          <div style={twoColumnGridStyle}>
            <label style={fieldStyle}>
              <span>이름 *</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="이름 입력" />
            </label>
            <label style={fieldStyle}>
              <span>연락처 *</span>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="전화번호 입력" />
            </label>
          </div>

          <div style={twoColumnGridStyle}>
            <label style={fieldStyle}>
              <span>연령대 (선택)</span>
              <select value={ageBand} onChange={(event) => setAgeBand(event.target.value)}>
                <option value="">선택 안 함</option>
                {ageBandOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label style={fieldStyle}>
              <span>지역 (선택)</span>
              <select value={region} onChange={(event) => setRegion(event.target.value)}>
                <option value="">선택 안 함</option>
                {regionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label style={fieldStyle}>
            <span>추천인 ID (선택)</span>
            <input value={referrerId} onChange={(event) => setReferrerId(event.target.value)} placeholder="선택 입력" />
          </label>

          {mode === "investigator" ? (
            <div style={highlightPanelStyle}>
              <label style={fieldStyle}>
                <span>회사명 *</span>
                <input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="회사명 입력" />
              </label>
              <label style={fieldStyle}>
                <span>조사자코드 *</span>
                <input value={investigatorCode} onChange={(event) => setInvestigatorCode(event.target.value)} placeholder="조사자코드 입력" />
              </label>
            </div>
          ) : null}

          <div style={consentPanelStyle}>
            <label style={checkboxStyle}>
              <input
                style={checkboxInputStyle}
                type="checkbox"
                checked={agreements.privacy}
                onChange={(event) => setAgreements((current) => ({ ...current, privacy: event.target.checked }))}
              />
              <span>개인정보 보호 및 민감정보 처리 안내를 확인하고 동의합니다.</span>
            </label>
            <label style={checkboxStyle}>
              <input
                style={checkboxInputStyle}
                type="checkbox"
                checked={agreements.legal}
                onChange={(event) => setAgreements((current) => ({ ...current, legal: event.target.checked }))}
              />
              <span>법적 안내 및 서비스 안전장치 문서를 확인했습니다.</span>
            </label>
            <label style={checkboxStyle}>
              <input
                style={checkboxInputStyle}
                type="checkbox"
                checked={agreements.deleteNotice}
                onChange={(event) => setAgreements((current) => ({ ...current, deleteNotice: event.target.checked }))}
              />
              <span>삭제된 자료는 복원이 어려우며 결과는 사용자 본인만 확인할 수 있음을 이해했습니다.</span>
            </label>
          </div>

          <button type="submit" disabled={!canSubmit || isSubmitting} style={primaryButtonStyle}>
            {isSubmitting ? "처리 중..." : "회원가입 신청"}
          </button>

          {status ? <div role="status">{status}</div> : null}
        </form>

        <div style={bottomInfoStyle}>
          <strong>이미 계정이 있으신가요?</strong>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
            가입 신청 또는 조사자 승인이 끝났다면 로그인 화면으로 이동해 계정 상태를 확인해 주세요.
          </p>
          <Link href="/sign-in" style={ghostLinkStyle}>
            로그인 화면으로 이동
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

const panelStyle = {
  display: "grid",
  gap: "18px",
  maxWidth: "760px",
  padding: "24px",
  border: "1px solid rgba(62, 49, 31, 0.09)",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.92)"
} as const;

const emailRowStyle = {
  display: "grid",
  gap: "8px",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center"
} as const;

const twoColumnGridStyle = {
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
} as const;

const highlightPanelStyle = {
  display: "grid",
  gap: "14px",
  padding: "16px",
  borderRadius: "18px",
  background: "#fff8ef",
  border: "1px solid var(--border)"
} as const;

const consentPanelStyle = {
  display: "grid",
  gap: "10px",
  padding: "16px",
  borderRadius: "18px",
  border: "1px solid var(--border)",
  background: "#fffdf8"
} as const;

const bottomInfoStyle = {
  display: "grid",
  gap: "10px",
  maxWidth: "760px",
  padding: "18px 20px",
  border: "1px solid var(--border)",
  borderRadius: "20px",
  background: "#fffdf8"
} as const;

const fieldStyle = {
  display: "grid",
  gap: "8px"
} as const;

const checkboxStyle = {
  display: "grid",
  gap: "14px",
  gridTemplateColumns: "20px minmax(0, 1fr)",
  alignItems: "start",
  lineHeight: 1.6
} as const;

const checkboxInputStyle = {
  margin: "4px 0 0",
  width: "16px",
  height: "16px"
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

const secondaryButtonStyle = {
  border: "1px solid var(--border)",
  borderRadius: "999px",
  padding: "12px 16px",
  background: "var(--surface)",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 600,
  whiteSpace: "nowrap"
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
