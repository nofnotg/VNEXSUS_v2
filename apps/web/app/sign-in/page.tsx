import { AppShell } from "../../components/app-shell";

export default function SignInPage() {
  return (
    <AppShell heading="Sign in" subheading="Auth skeleton only. Real provider wiring is intentionally deferred beyond Epic 0.">
      <PlaceholderAuthCard
        title="이메일 로그인 skeleton"
        items={[
          "이 단계에서는 실제 인증 연동 대신 session contract와 route 보호 구조만 둡니다.",
          "consumer / investigator / admin role 분리는 세션 payload 기준으로 유지합니다."
        ]}
      />
    </AppShell>
  );
}

function PlaceholderAuthCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section style={{ border: "1px solid var(--border)", borderRadius: "20px", padding: "20px" }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--muted)", lineHeight: 1.7 }}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
