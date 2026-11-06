
export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#fff",
      color: "#111",
      padding: "35px 8%",
      fontFamily: "Arial, Helvetica, sans-serif",
    }}>
      <nav style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #eee",
        paddingBottom: "22px",
        flexWrap: "wrap",
        gap: "20px",
      }}>
        <img
          src="/vmf-logo.png"
          alt="VMF Logo"
          style={{ width: "75px", height: "75px", objectFit: "contain" }}
        />

        <span style={{
          color: "#777",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "3px",
        }}>
          VIRTUAL MODIFIED FOOTBALL
        </span>
      </nav>

      <section style={{
        maxWidth: "900px",
        margin: "130px auto",
        textAlign: "center",
      }}>
        <p style={{
          color: "#888",
          letterSpacing: "5px",
          fontSize: "11px",
          fontWeight: 800,
        }}>
          THE OFFICIAL VMF PLATFORM
        </p>

        <h1 style={{
          fontSize: "clamp(48px, 9vw, 100px)",
          fontWeight: 900,
          letterSpacing: "-6px",
          lineHeight: 0.95,
          margin: "25px 0",
        }}>
          MORE THAN<br />FOOTBALL.
        </h1>

        <p style={{
          color: "#777",
          fontSize: "15px",
          lineHeight: 1.8,
          maxWidth: "550px",
          margin: "25px auto",
        }}>
          Discover the verified players, administrators and
          community behind Virtual Modified Football.
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
            fontWeight: 800,
            fontSize: "12px",
            letterSpacing: "1px",
            textDecoration: "none",
          }}>
            VERIFIED PLAYERS →
          </a>

          <a href="/administrators" style={{
            border: "1px solid #ddd",
            color: "#111",
            padding: "16px 25px",
            borderRadius: "6px",
            fontWeight: 800,
            fontSize: "12px",
            letterSpacing: "1px",
            textDecoration: "none",
          }}>
            ADMINISTRATORS
          </a>
        </div>
      </section>

      <footer style={{
        borderTop: "1px solid #eee",
        paddingTop: "25px",
        color: "#999",
        fontSize: "11px",
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        letterSpacing: "1px",
      }}>
        <span>© 2026 VMF</span>
        <span>VIRTUAL MODIFIED FOOTBALL</span>
      </footer>
    </main>
  );
}
