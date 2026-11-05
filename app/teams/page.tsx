
const teams: {
  name: string;
  description: string;
  members: number;
}[] = [];

export default function TeamsPage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#fafafa",
      color: "#111",
      fontFamily: "Arial, sans-serif",
    }}>
      <nav style={{
        minHeight: 78,
        padding: "0 5%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        flexWrap: "wrap",
        background: "#fff",
        borderBottom: "1px solid #eee",
      }}>
        <a href="/" style={{ fontSize: 28, fontWeight: 900 }}>VMF.</a>

        <div style={{ display: "flex", gap: 25, fontSize: 13, fontWeight: 600 }}>
          <a href="/">Home</a>
          <a href="/teams" style={{ fontWeight: 900 }}>Teams</a>
          <a href="/administrators">Administrators</a>
          <a href="/verify">Verification</a>
        </div>

        <a href="https://discord.com/" target="_blank" rel="noreferrer" style={{
          background: "#111",
          color: "#fff",
          padding: "12px 19px",
          borderRadius: 30,
          fontSize: 12,
          fontWeight: 700,
        }}>
          Join Our Discord ↗
        </a>
      </nav>

      <section style={{ maxWidth: 1400, margin: "auto", padding: "85px 6%" }}>
        <p style={{
          fontSize: 11,
          letterSpacing: 5,
          color: "#777",
          fontWeight: 800,
        }}>
          THE VMF COMMUNITY
        </p>

        <h1 style={{
          fontSize: "clamp(48px, 8vw, 85px)",
          fontWeight: 900,
          letterSpacing: -5,
          marginTop: 15,
        }}>
          TEAMS<span style={{ color: "#aaa" }}>.</span>
        </h1>

        <p style={{ color: "#777", fontSize: 15, marginTop: 15 }}>
          Discover the teams competing and representing the VMF community.
        </p>

        <div style={{
          marginTop: 55,
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 15,
          padding: "65px 20px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 40 }}>⚽</div>
          <h2 style={{ marginTop: 15, fontSize: 23 }}>
            Teams coming soon
          </h2>
          <p style={{ marginTop: 10, color: "#888", fontSize: 14 }}>
            Official VMF teams will be displayed here.
          </p>
        </div>
      </section>

      <footer style={{
        borderTop: "1px solid #eee",
        padding: "25px 5%",
        display: "flex",
        justifyContent: "space-between",
        color: "#999",
        fontSize: 11,
      }}>
        <span>© 2026 VMF</span>
        <span>VIRTUAL MATCH FOOTBALL</span>
      </footer>
    </main>
  );
}
