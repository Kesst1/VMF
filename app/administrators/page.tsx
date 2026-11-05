
const administrators = [
  {
    name: "VMF Founder",
    username: "Founder",
    position: "FOUNDER",
    level: "01",
  },
];

export default function AdministratorsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#fafafa", color: "#111" }}>
      <nav style={{
        height: 85,
        padding: "0 8%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#fff",
        borderBottom: "1px solid #eee"
      }}>
        <a href="/" style={{ fontSize: 27, fontWeight: 900 }}>VMF.</a>

        <div style={{ display: "flex", gap: 28, fontSize: 13 }}>
          <a href="/">Home</a>
          <a href="/players">Players</a>
          <a href="/administrators" style={{ fontWeight: 800 }}>Administrators</a>
          <a href="/verify">Verification</a>
        </div>
      </nav>

      <section style={{ maxWidth: 1200, margin: "auto", padding: "90px 8%" }}>
        <p style={{ fontSize: 11, letterSpacing: 4, color: "#888", fontWeight: 800 }}>
          THE VMF TEAM
        </p>

        <h1 style={{
          fontSize: "clamp(45px, 7vw, 76px)",
          fontWeight: 900,
          letterSpacing: -4,
          marginTop: 18
        }}>
          ADMINISTRATORS<span style={{ color: "#aaa" }}>.</span>
        </h1>

        <p style={{ color: "#777", marginTop: 15, lineHeight: 1.8 }}>
          Meet the people responsible for managing and developing VMF.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 18,
          marginTop: 55
        }}>
          {administrators.map((admin) => (
            <article key={admin.username} style={{
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 28
            }}>
              <div style={{
                width: 55,
                height: 55,
                borderRadius: 12,
                background: "#111",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                fontSize: 20
              }}>
                {admin.level}
              </div>

              <p style={{
                fontSize: 10,
                letterSpacing: 2,
                color: "#999",
                marginTop: 25
              }}>
                {admin.position}
              </p>

              <h2 style={{ fontSize: 22, marginTop: 8 }}>
                {admin.name}
              </h2>

              <p style={{ color: "#888", fontSize: 13, marginTop: 6 }}>
                @{admin.username}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer style={{
        borderTop: "1px solid #eee",
        padding: "30px 8%",
        color: "#999",
        fontSize: 12
      }}>
        © 2026 VMF — VIRTUAL MATCH FOOTBALL
      </footer>
    </main>
  );
}
