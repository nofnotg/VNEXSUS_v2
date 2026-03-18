import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "../../components/app-shell";
import { getSessionUser } from "../../lib/session";
import { listCasesForUser } from "../../lib/server/services/case-service";

function resolvePlanLabel(role: string) {
  if (role === "investigator") {
    return "Starter";
  }

  if (role === "admin") {
    return "Studio";
  }

  return "미리확인";
}

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/");
  }

  if (user.role === "admin") {
    redirect("/dashboard/admin");
  }

  const cases = await listCasesForUser(user.id, user.role);
  const readyCount = cases.filter((item) => item.status === "ready").length;
  const reviewCount = cases.filter((item) => item.status === "review_required").length;
  const processingCount = cases.filter((item) => item.status === "processing").length;

  const widgets = [
    { label: "이전 분석 수", value: String(cases.length), note: "현재 계정 기준 누적 케이스" },
    { label: "완료된 분석", value: String(readyCount), note: "보고서까지 확인 가능한 케이스" },
    { label: "검토 필요", value: String(reviewCount), note: "추가 검토가 필요한 케이스" },
    { label: "진행 중", value: String(processingCount), note: "OCR 또는 후처리 진행 중" }
  ];

  return (
    <AppShell heading="대시보드" subheading="최근 작업 상태와 이용 현황을 한 화면에서 바로 확인할 수 있도록 구성했습니다.">
      <div style={{ display: "grid", gap: "20px" }}>
        <section style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {widgets.map((widget) => (
            <article key={widget.label} style={widgetStyle}>
              <div style={{ color: "var(--muted)", fontSize: "14px" }}>{widget.label}</div>
              <strong style={{ fontSize: "30px" }}>{widget.value}</strong>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>{widget.note}</p>
            </article>
          ))}
        </section>

        <section style={{ display: "grid", gap: "16px", gridTemplateColumns: "minmax(280px, 1.4fr) minmax(240px, 1fr)" }}>
          <article style={cardStyle}>
            <h2 style={{ margin: 0 }}>이용 요약</h2>
            <div style={{ display: "grid", gap: "10px", color: "var(--muted)", lineHeight: 1.7 }}>
              <div>현재 역할: {user.role === "consumer" ? "일반사용자" : "손해사정조사자"}</div>
              <div>기본 플랜: {resolvePlanLabel(user.role)}</div>
              <div>표시 범위: 사용 횟수와 작업 상태 기준</div>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href="/cases/new" style={solidLinkStyle}>
                케이스 분석 시작
              </Link>
              <Link href="/cases" style={ghostLinkStyle}>
                이전 분석 목록
              </Link>
            </div>
          </article>

          <article style={cardStyle}>
            <h2 style={{ margin: 0 }}>작업 안내</h2>
            <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--muted)", lineHeight: 1.8 }}>
              <li>새 문서를 분석하려면 케이스 분석 메뉴로 이동해 주세요.</li>
              <li>이전 결과를 다시 보려면 이전 분석 목록에서 케이스를 열어 보세요.</li>
              <li>언어와 계정 정보는 설정 화면에서 변경할 수 있습니다.</li>
            </ul>
          </article>
        </section>
      </div>
    </AppShell>
  );
}

const widgetStyle = {
  display: "grid",
  gap: "10px",
  padding: "22px",
  borderRadius: "22px",
  border: "1px solid var(--border)",
  background: "#fffdf8"
} as const;

const cardStyle = {
  display: "grid",
  gap: "16px",
  padding: "24px",
  borderRadius: "22px",
  border: "1px solid var(--border)",
  background: "var(--surface)"
} as const;

const solidLinkStyle = {
  width: "fit-content",
  padding: "10px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  background: "var(--accent)",
  color: "var(--accent-foreground)",
  fontWeight: 700
} as const;

const ghostLinkStyle = {
  width: "fit-content",
  padding: "10px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  border: "1px solid var(--border)",
  color: "inherit",
  fontWeight: 600
} as const;
