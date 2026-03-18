"use client";

import { useEffect, useMemo, useState } from "react";
import { type LocaleCode } from "@vnexus/shared";
import { useLocale } from "../../components/locale-provider";
import { useTheme, type ThemeMode } from "../../components/theme-provider";
import { updateAccountProfile, verifyAccountPassword } from "../../lib/client/account-settings-api";
import { regionOptions } from "../../lib/constants/region-options";

type AccountForm = {
  name: string;
  email: string;
  phone: string;
  region: string;
  locale: LocaleCode;
  theme: ThemeMode;
};

const emptyAccount: AccountForm = {
  name: "",
  email: "",
  phone: "",
  region: "",
  locale: "ko",
  theme: "light"
};

export function SettingsClient() {
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [account, setAccount] = useState<AccountForm>(emptyAccount);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setAccount((current) => ({
      ...current,
      locale,
      theme
    }));
  }, [locale, theme]);

  const passwordMessage = useMemo(() => {
    if (!newPassword && !confirmPassword) {
      return null;
    }

    if (newPassword.length < 8) {
      return "새 비밀번호는 8자 이상 입력해 주세요.";
    }

    if (newPassword !== confirmPassword) {
      return "새 비밀번호와 확인 값이 일치하지 않습니다.";
    }

    return "새 비밀번호를 저장할 수 있습니다.";
  }, [confirmPassword, newPassword]);

  const canSave = isUnlocked && currentPassword.trim().length > 0 && (!newPassword || (newPassword.length >= 8 && newPassword === confirmPassword));

  async function handleUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsUnlocking(true);
    setUnlockError(null);
    setSaveMessage(null);

    try {
      const data = await verifyAccountPassword(currentPassword);
      setAccount(data);
      setLocale(data.locale);
      setTheme(data.theme);
      setIsUnlocked(true);
    } catch (error) {
      setUnlockError(error instanceof Error ? error.message : "비밀번호 확인에 실패했습니다.");
    } finally {
      setIsUnlocking(false);
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) {
      setSaveMessage("연락처, 지역 또는 비밀번호 입력값을 다시 확인해 주세요.");
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const saved = await updateAccountProfile({
        currentPassword,
        phone: account.phone,
        region: account.region,
        locale: account.locale,
        theme: account.theme,
        ...(newPassword ? { newPassword } : {}),
        ...(confirmPassword ? { confirmPassword } : {})
      });

      setAccount(saved);
      setLocale(saved.locale);
      setTheme(saved.theme);
      setNewPassword("");
      setConfirmPassword("");
      setSaveMessage("설정을 저장했습니다.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "설정 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isUnlocked) {
    return (
      <form onSubmit={handleUnlock} style={panelStyle}>
        <div style={{ display: "grid", gap: "8px" }}>
          <h2 style={{ margin: 0, fontSize: "24px" }}>설정 잠금 해제</h2>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.8 }}>
            설정 화면은 비밀번호를 다시 확인한 뒤 열 수 있습니다. 이름과 이메일은 읽기 전용이며, 연락처·지역·비밀번호를 변경할 수 있습니다.
          </p>
        </div>

        <label style={fieldStyle}>
          <span>현재 비밀번호</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="현재 비밀번호를 입력해 주세요."
          />
        </label>

        <button type="submit" disabled={isUnlocking || currentPassword.trim().length === 0} style={primaryButtonStyle}>
          {isUnlocking ? "확인 중..." : "설정 열기"}
        </button>

        {unlockError ? <p style={{ margin: 0, color: "#8d2b22" }}>{unlockError}</p> : null}
      </form>
    );
  }

  return (
    <form onSubmit={handleSave} style={{ display: "grid", gap: "20px", maxWidth: "760px" }}>
      <section style={panelStyle}>
        <div style={{ display: "grid", gap: "8px" }}>
          <h2 style={{ margin: 0, fontSize: "24px" }}>기본 계정 정보</h2>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.8 }}>
            이름과 이메일은 변경할 수 없고, 연락처와 지역은 이 화면에서 바꿀 수 있습니다.
          </p>
        </div>

        <div style={gridStyle}>
          <label style={fieldStyle}>
            <span>이름</span>
            <input value={account.name} readOnly style={readonlyStyle} />
          </label>
          <label style={fieldStyle}>
            <span>이메일 주소</span>
            <input value={account.email} readOnly style={readonlyStyle} />
          </label>
        </div>

        <div style={gridStyle}>
          <label style={fieldStyle}>
            <span>연락처</span>
            <input value={account.phone} onChange={(event) => setAccount((current) => ({ ...current, phone: event.target.value }))} />
          </label>
          <label style={fieldStyle}>
            <span>지역</span>
            <select value={account.region} onChange={(event) => setAccount((current) => ({ ...current, region: event.target.value }))}>
              <option value="">선택 안 함</option>
              {regionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section style={panelStyle}>
        <div style={{ display: "grid", gap: "8px" }}>
          <h2 style={{ margin: 0, fontSize: "24px" }}>환경 설정</h2>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.8 }}>
            언어는 이 화면에서만 변경할 수 있습니다. 기본 언어는 한국어를 우선으로 유지합니다.
          </p>
        </div>

        <div style={gridStyle}>
          <label style={fieldStyle}>
            <span>표시 언어</span>
            <select
              value={account.locale}
              onChange={(event) => setAccount((current) => ({ ...current, locale: event.target.value as LocaleCode }))}
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
          </label>

          <label style={fieldStyle}>
            <span>테마</span>
            <select
              value={account.theme}
              onChange={(event) => setAccount((current) => ({ ...current, theme: event.target.value as ThemeMode }))}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
      </section>

      <section style={panelStyle}>
        <div style={{ display: "grid", gap: "8px" }}>
          <h2 style={{ margin: 0, fontSize: "24px" }}>비밀번호 변경</h2>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.8 }}>
            새 비밀번호를 입력하지 않으면 기존 비밀번호를 유지합니다.
          </p>
        </div>

        <div style={gridStyle}>
          <label style={fieldStyle}>
            <span>새 비밀번호</span>
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="8자 이상" />
          </label>
          <label style={fieldStyle}>
            <span>새 비밀번호 확인</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="비밀번호를 한 번 더 입력해 주세요."
            />
          </label>
        </div>

        {passwordMessage ? (
          <p style={{ margin: 0, color: passwordMessage.includes("저장할 수 있습니다") ? "var(--muted)" : "#8d2b22" }}>{passwordMessage}</p>
        ) : null}
      </section>

      <section style={panelStyle}>
        <label style={fieldStyle}>
          <span>저장을 위한 현재 비밀번호 확인</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="저장 전에 현재 비밀번호를 다시 입력해 주세요."
          />
        </label>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button type="submit" disabled={!canSave || isSaving} style={primaryButtonStyle}>
            {isSaving ? "저장 중..." : "변경사항 저장"}
          </button>
        </div>

        {saveMessage ? <p style={{ margin: 0, color: saveMessage.includes("저장했습니다") ? "var(--muted)" : "#8d2b22" }}>{saveMessage}</p> : null}
      </section>
    </form>
  );
}

const panelStyle = {
  display: "grid",
  gap: "18px",
  padding: "26px",
  borderRadius: "24px",
  border: "1px solid rgba(62, 49, 31, 0.09)",
  background: "rgba(255,255,255,0.9)",
  boxShadow: "0 18px 42px rgba(27, 26, 23, 0.05)"
} as const;

const gridStyle = {
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
} as const;

const fieldStyle = {
  display: "grid",
  gap: "8px"
} as const;

const primaryButtonStyle = {
  width: "fit-content",
  padding: "12px 18px",
  borderRadius: "999px",
  border: "1px solid var(--accent)",
  background: "var(--accent)",
  color: "var(--accent-foreground)",
  fontWeight: 700
} as const;

const readonlyStyle = {
  background: "rgba(244, 241, 234, 0.88)",
  color: "#5a544b"
} as const;
