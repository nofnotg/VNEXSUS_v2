import { redirect } from "next/navigation";
import { AppShell } from "../../../components/app-shell";
import { getSessionUser } from "../../../lib/session";
import { CaseAnalysisClient } from "./case-analysis-client";

export default async function NewCasePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/");
  }

  return (
    <AppShell heading="케이스 분석" subheading="피보험자 정보와 파일을 입력하고 OCR 분석을 시작합니다.">
      <CaseAnalysisClient userRole={user.role} />
    </AppShell>
  );
}
