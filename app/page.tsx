
export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#fff",
      color: "#111",
      padding: "40px 8%",
    }}>
      <nav style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #eee",
        paddingBottom: "25px",
      }}>
        <h1 style={{fontSize: "28px", fontWeight: 900}}>
          VMF<span style={{color: "#999"}}>.</span>
        </h1>
        <span style={{color: "#777", fontSize: "13px"}}>
          VIRTUAL MATCH FOOTBALL
        </span>
      </nav>

      <section style={{
        maxWidth: "850px",
        margin: "150px auto",
        textAlign: "center",
      }}>
        <p style={{
          color: "#777",
          letterSpacing: "4px",
          fontSize: "12px",
          fontWeight: 700,
        }}>
          THE OFFICIAL VMF PLATFORM
        </p>

        <h2 style={{
          fontSize: "clamp(48px, 9vw, 100px)",
          fontWeight: 900,
          letterSpacing: "-6px",
          margin: "25px 0",
        }}>
          MORE THAN<br />FOOTBALL.
        </h2>

        <p style={{
          color: "#777",
          fontSize: "16px",
          lineHeight: 1.8,
        }}>
          Discover the players, administrators and community
          behind VMF.
        </p>

        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          marginTop: "35px",
          flexWrap: "wrap",
        }}>
          <a href="/players" style={{
            background: "#111",
            color: "#fff",
            padding: "16px 25px",
            borderRadius: "6px",
            fontWeight: 700,
          }}>
            Verified Players →
          </a>

          <a href="/administrators" style={{
            border: "1px solid #ddd",
            padding: "16px 25px",
            borderRadius: "6px",
            fontWeight: 700,
          }}>
            Administrators
          </a>
        </div>
      </section>

      <footer style={{
        borderTop: "1px solid #eee",
        paddingTop: "25px",
        color: "#999",
        fontSize: "12px",
        display: "flex",
        justifyContent: "space-between",
      }}>
        <span>© 2026 VMF</span>
        <span>VIRTUAL MATCH FOOTBALL</span>
      </footer>
    </main>
  );
}
