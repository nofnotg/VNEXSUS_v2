import { requireRole } from "../../../lib/auth-guards";
import { AppShell } from "../../../components/app-shell";

export default async function ConsumerDashboardPage() {
  await requireRole(["consumer", "admin"]);

  return (
    <AppShell heading="Consumer Dashboard" subheading="일반사용자 결과 UX placeholder">
      <p style={{ margin: 0, color: "var(--muted)" }}>
        `risk_signals`, `timeline_summary`, `hospital_summary`, `check_points`, `recommended_next_actions` 계약은
        shared package에 먼저 고정하고 실제 렌더링은 Epic 4에서 진행합니다.
      </p>
    </AppShell>
  );
}
