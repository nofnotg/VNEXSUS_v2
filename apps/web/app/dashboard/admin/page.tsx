import { requireRole } from "../../../lib/auth-guards";
import { AppShell } from "../../../components/app-shell";

export default async function AdminDashboardPage() {
  await requireRole(["admin"]);

  return (
    <AppShell heading="Admin Console" subheading="운영자 placeholder">
      <p style={{ margin: 0, color: "var(--muted)" }}>
        사용자, 플랜, 실패 job, 연결 요청 관리는 구조만 열어두고 실제 기능 구현은 Epic 5 이후로 미룹니다.
      </p>
    </AppShell>
  );
}
