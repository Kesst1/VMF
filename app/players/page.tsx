
const players: { name: string; username: string; role: string }[] = [];

export default function PlayersPage() {
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
          <a href="/players" style={{ fontWeight: 800 }}>Players</a>
          <a href="/administrators">Administrators</a>
          <a href="/verify">Verification</a>
        </div>
      </nav>

      <section style={{ padding: "90px 8% 40px", maxWidth: 1300, margin: "auto" }}>
        <p style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 4,
          color: "#888"
        }}>
          VMF COMMUNITY
        </p>

        <h1 style={{
          fontSize: "clamp(45px, 7vw, 76px)",
          letterSpacing: -4,
          fontWeight: 900,
          marginTop: 18
        }}>
          VERIFIED PLAYERS<span style={{ color: "#aaa" }}>.</span>
        </h1>

        <p style={{
          color: "#777",
          fontSize: 15,
          marginTop: 15,
          lineHeight: 1.8
        }}>
          Discover the officially verified members of the VMF community.
        </p>

        <div style={{
          marginTop: 55,
          padding: 25,
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <p style={{ fontSize: 12, color: "#888" }}>OFFICIAL DIRECTORY</p>
            <h2 style={{ fontSize: 25, marginTop: 8 }}>Player Directory</h2>
          </div>
          <span style={{
            background: "#f2f2f2",
            padding: "10px 15px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700
          }}>
            {players.length} PLAYERS
          </span>
        </div>

        {players.length === 0 ? (
          <div style={{
            marginTop: 20,
            padding: "75px 20px",
            textAlign: "center",
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 12
          }}>
            <div style={{ fontSize: 35 }}>◎</div>
            <h3 style={{ fontSize: 20, marginTop: 15 }}>
              No verified players yet
            </h3>
            <p style={{ color: "#888", fontSize: 14, marginTop: 10 }}>
              Verified members will appear here once they join the directory.
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 18,
            marginTop: 20
          }}>
            {players.map((player) => (
              <article key={player.username} style={{
                background: "#fff",
                border: "1px solid #eee",
                padding: 25,
                borderRadius: 12
              }}>
                <h3>{player.name}</h3>
                <p style={{ color: "#888" }}>@{player.username}</p>
                <p>{player.role}</p>
              </article>
            ))}
          </div>
        )}
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
