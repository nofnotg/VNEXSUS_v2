"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useLocaleMessages } from "./locale-provider";

export function AppShell({
  heading,
  subheading,
  children
}: {
  heading: string;
  subheading: string;
  children: ReactNode;
}) {
  const localeMessages = useLocaleMessages();
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isPublicPage = pathname === "/" || pathname === "/sign-in" || pathname === "/sign-up";

  if (isPublicPage) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #f6efe2 0%, #f8f5ef 100%)",
          padding: "32px"
        }}
      >
        <div style={{ maxWidth: "1080px", margin: "0 auto", display: "grid", gap: "24px" }}>
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap"
            }}
          >
            <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "0.08em" }}>VNEXSUS</div>
            </Link>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/sign-in" style={publicLinkStyle(pathname === "/sign-in" ? "solid" : "ghost")}>
                로그인
              </Link>
              <Link href="/sign-up" style={publicLinkStyle(pathname === "/sign-up" ? "solid" : "ghost")}>
                회원가입
              </Link>
            </div>
          </header>

          <section
            style={{
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(62, 49, 31, 0.08)",
              borderRadius: "28px",
              padding: "36px",
              boxShadow: "0 20px 60px rgba(27, 26, 23, 0.08)"
            }}
          >
            <div style={{ maxWidth: "760px", display: "grid", gap: "12px" }}>
              <div style={{ fontSize: "12px", letterSpacing: "0.16em", color: "var(--muted)" }}>MEDICAL CASE REVIEW</div>
              <h1 style={{ margin: 0, fontSize: "32px", lineHeight: 1.25 }}>{heading}</h1>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.8 }}>{subheading}</p>
            </div>
            <div style={{ marginTop: "28px" }}>{children}</div>
          </section>
        </div>
      </main>
    );
  }

  const navItems = [
    { href: "/dashboard", label: localeMessages.uiDashboard },
    { href: "/cases", label: "이전 분석 목록" },
    { href: "/cases/new", label: "케이스 분석" },
    { href: "/settings", label: localeMessages.uiSettings }
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#f5f1ea" }}>
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "288px minmax(0, 1fr)"
        }}
      >
        <aside
          style={{
            position: "sticky",
            top: 0,
            alignSelf: "start",
            minHeight: "100vh",
            padding: "28px 20px",
            background: "linear-gradient(180deg, #1d1916 0%, #2a231d 100%)",
            color: "#f7f3ed",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "grid",
            gap: "28px",
            alignContent: "start"
          }}
        >
          <div style={{ display: "grid", gap: "10px" }}>
            <Link href="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #d9bc87 0%, #a47b3c 100%)"
                  }}
                />
                <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "0.08em" }}>VNEXSUS</div>
              </div>
            </Link>
            <p style={{ margin: 0, color: "rgba(247,243,237,0.72)", fontSize: "14px", lineHeight: 1.7 }}>
              의료문서 분석부터 결과 보고서 확인까지 이어지는 작업 공간입니다.
            </p>
          </div>

          <nav style={{ display: "grid", gap: "8px" }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    padding: "13px 14px",
                    borderRadius: "16px",
                    background: isActive ? "rgba(255,255,255,0.14)" : "transparent",
                    border: isActive ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
                    fontWeight: isActive ? 700 : 500
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ marginTop: "auto", display: "grid", gap: "14px" }}>
            <button
              type="button"
              disabled={isSigningOut}
              onClick={async () => {
                setIsSigningOut(true);

                try {
                  await fetch("/api/auth/sign-out", {
                    method: "POST",
                    credentials: "same-origin"
                  });
                } finally {
                  router.push("/");
                  router.refresh();
                }
              }}
              style={{
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: "999px",
                padding: "11px 15px",
                background: "rgba(255,255,255,0.08)",
                color: "#f7f3ed",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {isSigningOut ? "로그아웃 중..." : "로그아웃"}
            </button>

            <div
              style={{
                padding: "16px",
                borderRadius: "18px",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(247,243,237,0.74)",
                fontSize: "13px",
                lineHeight: 1.7
              }}
            >
              이전 분석 목록에서 이어보기, 케이스 분석에서 새 문서 업로드, 설정에서 언어와 계정 정보를 관리할 수 있습니다.
            </div>
          </div>
        </aside>

        <div style={{ padding: "28px 32px 40px" }}>
          <div style={{ maxWidth: "1180px", margin: "0 auto", display: "grid", gap: "20px" }}>
            <header
              style={{
                padding: "28px 30px",
                border: "1px solid rgba(62, 49, 31, 0.1)",
                borderRadius: "28px",
                background: "rgba(255,255,255,0.76)",
                boxShadow: "0 20px 50px rgba(27, 26, 23, 0.06)",
                backdropFilter: "blur(8px)",
                display: "grid",
                gap: "10px"
              }}
            >
              <div style={{ fontSize: "12px", letterSpacing: "0.14em", color: "var(--muted)" }}>WORKSPACE</div>
              <h1 style={{ margin: 0, fontSize: "30px", lineHeight: 1.2 }}>{heading}</h1>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.8 }}>{subheading}</p>
            </header>

            <section>{children}</section>
          </div>
        </div>
      </div>
    </main>
  );
}

function publicLinkStyle(variant: "solid" | "ghost") {
  return {
    padding: "12px 18px",
    borderRadius: "999px",
    border: variant === "solid" ? "1px solid var(--accent)" : "1px solid var(--border)",
    background: variant === "solid" ? "var(--accent)" : "transparent",
    color: variant === "solid" ? "var(--accent-foreground)" : "var(--foreground)",
    fontWeight: 600,
    textDecoration: "none"
  } as const;
}
