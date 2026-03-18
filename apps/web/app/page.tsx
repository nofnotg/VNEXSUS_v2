import { AppShell } from "../components/app-shell";

const featureCards = [
  {
    title: "날짜 중심 분석",
    body: "의료 문서 안의 날짜를 먼저 정리하고, 같은 날짜에 연결된 진단·검사·치료 내용을 함께 묶어 보여줍니다."
  },
  {
    title: "근거 기반 결과",
    body: "핵심 이벤트를 근거 블록과 연결해 조사자용 보고서와 일반사용자용 결과를 각각 안정적으로 제공합니다."
  },
  {
    title: "사용자 중심 보안",
    body: "개인정보를 임의로 열람하거나 판매하지 않는 방향을 기본 원칙으로 두고, 사용자가 직접 결과를 확인하도록 구성했습니다."
  }
];

export default function LandingPage() {
  return (
    <AppShell
      heading="의료 문서 분석을 더 간단하게"
      subheading="첫 화면에서는 서비스 소개와 로그인 진입만 보여주고, 실제 작업은 로그인 이후 대시보드와 케이스 분석 화면에서 이어지도록 구성했습니다."
    >
      <div style={{ display: "grid", gap: "24px" }}>
        <section style={{ maxWidth: "760px", display: "grid", gap: "14px" }}>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.8 }}>
            VNEXSUS는 보험 심사와 손해사정 검토를 위해 의료 문서의 날짜, 병원, 검사, 진단, 치료 이벤트를 구조적으로 정리하는 서비스입니다.
          </p>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.8 }}>
            로그인 후에는 이전 분석 목록, 케이스 분석, 대시보드, 설정을 왼쪽 사이드바에서 이동할 수 있도록 정리했습니다.
          </p>
        </section>

        <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {featureCards.map((card) => (
            <article
              key={card.title}
              style={{
                padding: "22px",
                borderRadius: "20px",
                border: "1px solid var(--border)",
                background: "#fffdf8"
              }}
            >
              <h2 style={{ margin: 0, fontSize: "20px" }}>{card.title}</h2>
              <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.7 }}>{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
