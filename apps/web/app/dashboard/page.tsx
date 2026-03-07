import Link from "next/link";
import { AppShell } from "../../components/app-shell";

const panels = [
  {
    title: "Consumer",
    body: "OCR-only 기본 경로와 정밀분석 gating 준비 상태를 확인하는 placeholder"
  },
  {
    title: "Investigator",
    body: "케이스 / evidence / 보고서 탭 자리만 먼저 고정하는 placeholder"
  },
  {
    title: "Admin",
    body: "실패 작업, 플랜, 연결 요청 모니터링 자리만 먼저 확보"
  }
];

export default function DashboardPage() {
  return (
    <AppShell heading="Dashboard" subheading="Role-based dashboard placeholder. Real data binding starts after Epic 0.">
      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {panels.map((panel) => (
          <article key={panel.title} style={{ border: "1px solid var(--border)", borderRadius: "20px", padding: "20px" }}>
            <h2 style={{ marginTop: 0 }}>{panel.title}</h2>
            <p style={{ color: "var(--muted)" }}>{panel.body}</p>
            <Link href={`/dashboard/${panel.title.toLowerCase()}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
              Open placeholder
            </Link>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
