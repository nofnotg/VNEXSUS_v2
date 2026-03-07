import Link from "next/link";
import { AppShell } from "../components/app-shell";

const featureCards = [
  {
    title: "날짜-이벤트 엔진 우선",
    body: "Epic 0에서는 코어 도메인 경계를 먼저 고정하고, UI는 placeholder 수준으로 제한합니다."
  },
  {
    title: "Evidence-first 계약",
    body: "핵심 결과는 모두 click-to-evidence 경로를 전제로 설계됩니다."
  },
  {
    title: "역할별 UX 분기",
    body: "일반사용자와 조사자는 같은 엔진을 쓰되, 라우트와 결과 노출은 명확히 분기합니다."
  }
];

export default function LandingPage() {
  return (
    <AppShell
      heading="의료문서 구조화 엔진"
      subheading="Epic 0 baseline: monorepo, auth skeleton, Prisma schema, shared contracts"
    >
      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {featureCards.map((card) => (
          <article
            key={card.title}
            style={{
              padding: "20px",
              borderRadius: "18px",
              border: "1px solid var(--border)",
              background: "#fffaf1"
            }}
          >
            <h2 style={{ margin: 0, fontSize: "20px" }}>{card.title}</h2>
            <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>{card.body}</p>
          </article>
        ))}
      </div>
      <div style={{ display: "flex", gap: "12px", marginTop: "24px", flexWrap: "wrap" }}>
        <Link href="/sign-in" style={buttonStyle("solid")}>
          Sign in
        </Link>
        <Link href="/sign-up" style={buttonStyle("ghost")}>
          Sign up
        </Link>
      </div>
    </AppShell>
  );
}

function buttonStyle(variant: "solid" | "ghost") {
  return {
    padding: "12px 18px",
    borderRadius: "999px",
    border: variant === "solid" ? "1px solid var(--accent)" : "1px solid var(--border)",
    background: variant === "solid" ? "var(--accent)" : "transparent",
    color: variant === "solid" ? "var(--accent-foreground)" : "var(--foreground)",
    fontWeight: 600
  } as const;
}
