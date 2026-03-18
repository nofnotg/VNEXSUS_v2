import { AppShell } from "../../../components/app-shell";
import { requireRole } from "../../../lib/auth-guards";
import { AdminDashboardClient } from "./admin-dashboard-client";

export default async function AdminDashboardPage() {
  await requireRole(["admin"]);

  return (
    <AppShell
      heading="운영자 대시보드"
      subheading="손해사정조사자 승인 요청, 플랜 부여, 사용자 접속 제한을 한 화면에서 관리할 수 있습니다."
    >
      <AdminDashboardClient />
    </AppShell>
  );
}
