import Link from "next/link";
import { redirect } from "next/navigation";
import { ApiError } from "@vnexus/shared";
import { AppShell } from "../../components/app-shell";
import { getSessionUser } from "../../lib/session";
import { CaseListClient } from "./case-list-client";

export default async function CasesPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/");
  }

  if (!["consumer", "investigator", "admin"].includes(user.role)) {
    throw new ApiError("FORBIDDEN", "This role cannot open case list");
  }

  return (
    <AppShell heading="이전 분석 목록" subheading="이전에 분석한 케이스, 보고서, PDF를 다시 열어보는 화면입니다.">
      <div style={{ display: "grid", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
            목록이 비어 있으면 아직 분석한 케이스가 없다는 뜻입니다. 새 문서 분석은 케이스 분석 메뉴에서 시작할 수 있습니다.
          </p>
          <Link
            href="/cases/new"
            style={{
              padding: "10px 16px",
              borderRadius: "999px",
              textDecoration: "none",
              background: "var(--accent)",
              color: "var(--accent-foreground)",
              fontWeight: 700
            }}
          >
            케이스 분석 시작
          </Link>
        </div>
        <CaseListClient />
      </div>
    </AppShell>
  );
}
