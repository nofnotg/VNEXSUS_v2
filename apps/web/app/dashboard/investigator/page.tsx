import { requireRole } from "../../../lib/auth-guards";
import { AppShell } from "../../../components/app-shell";

export default async function InvestigatorDashboardPage() {
  await requireRole(["investigator", "admin"]);

  return (
    <AppShell heading="Investigator Dashboard" subheading="조사자 보고서 / evidence placeholder">
      <p style={{ margin: 0, color: "var(--muted)" }}>
        click-to-evidence UI는 이후 Epic에서 구현하고, 현재는 route guard와 shell만 고정합니다.
      </p>
    </AppShell>
  );
}
