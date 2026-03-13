"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/app-shell";

const demoUsers = [
  {
    label: "Demo Investigator",
    payload: {
      id: "demo-user",
      email: "demo-investigator@vnexus.local",
      role: "investigator",
      status: "active"
    }
  },
  {
    label: "Demo Consumer",
    payload: {
      id: "demo-consumer",
      email: "demo-consumer@vnexus.local",
      role: "consumer",
      status: "active"
    }
  },
  {
    label: "Demo Admin",
    payload: {
      id: "demo-admin",
      email: "demo-admin@vnexus.local",
      role: "admin",
      status: "active"
    }
  }
] as const;

export default function SignInPage() {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(demoUsers[selectedIndex]!.payload)
      });

      if (!response.ok) {
        throw new Error("Sign-in failed");
      }

      router.push("/cases");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell
      heading="Sign in"
      subheading="Local demo sign-in creates a session cookie so you can open cases, analytics, reports, and settings."
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "16px",
          maxWidth: "420px",
          padding: "20px",
          border: "1px solid var(--border)",
          borderRadius: "20px"
        }}
      >
        <label style={{ display: "grid", gap: "8px" }}>
          <span>Demo role</span>
          <select aria-label="Demo role" value={selectedIndex} onChange={(event) => setSelectedIndex(Number(event.target.value))}>
            {demoUsers.map((option, index) => (
              <option key={option.payload.id} value={index}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          <div>Email: {demoUsers[selectedIndex]!.payload.email}</div>
          <div>Role: {demoUsers[selectedIndex]!.payload.role}</div>
        </div>

        <button type="submit" disabled={isSubmitting} style={buttonStyle}>
          {isSubmitting ? "Signing in..." : "Continue"}
        </button>

        {status ? (
          <div role="status" style={{ color: "#8d2b22" }}>
            {status}
          </div>
        ) : null}
      </form>
    </AppShell>
  );
}

const buttonStyle = {
  border: "1px solid var(--border)",
  borderRadius: "999px",
  padding: "12px 16px",
  background: "var(--accent)",
  color: "var(--accent-foreground)",
  cursor: "pointer",
  fontWeight: 600
} as const;
