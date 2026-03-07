import { AppShell } from "../../components/app-shell";

export default function SignUpPage() {
  return (
    <AppShell heading="Sign up" subheading="Role selection and consent checkpoints are fixed in contract, not fully wired yet.">
      <section style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {[
          { role: "consumer", description: "미리확인 / 정밀확인 / 전문가연결 흐름" },
          { role: "investigator", description: "Starter / Pro / Studio와 evidence 중심 보고서 흐름" },
          { role: "admin", description: "운영 콘솔 접근은 별도 권한으로 제한" }
        ].map((item) => (
          <article key={item.role} style={{ border: "1px solid var(--border)", borderRadius: "18px", padding: "18px" }}>
            <h2 style={{ marginTop: 0, textTransform: "capitalize" }}>{item.role}</h2>
            <p style={{ marginBottom: 0, color: "var(--muted)" }}>{item.description}</p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
