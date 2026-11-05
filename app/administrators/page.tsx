
type Member = {
  name: string;
  username: string;
  userId?: number;
  title: string;
};

const groups: {
  name: string;
  description: string;
  icon: string;
  members: Member[];
}[] = [
  {
    name: "OWNERS",
    description: "The founders and highest authorities of VMF.",
    icon: "♛",
    members: [
      { name: "Add Owner", username: "RobloxUsername", title: "Owner • Founder" },
      { name: "Add Owner", username: "RobloxUsername", title: "Owner • Developer" },
    ],
  },
  {
    name: "ADMINS",
    description: "Help manage and maintain the VMF community.",
    icon: "⬡",
    members: [
      { name: "Add Admin", username: "RobloxUsername", title: "Administrator" },
      { name: "Add Admin", username: "RobloxUsername", title: "Administrator" },
      { name: "Add Admin", username: "RobloxUsername", title: "Administrator" },
    ],
  },
  {
    name: "COMMUNITY",
    description: "Support the community and help with general tasks.",
    icon: "♟",
    members: [
      { name: "Add Member", username: "RobloxUsername", title: "Community" },
      { name: "Add Member", username: "RobloxUsername", title: "Community" },
    ],
  },
];

function MemberCard({ member }: { member: Member }) {
  const initials = member.name.slice(0, 2).toUpperCase();

  return (
    <a
      href={member.userId ? `https://www.roblox.com/users/${member.userId}/profile` : "#"}
      target={member.userId ? "_blank" : undefined}
      rel="noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 15,
        padding: "12px 15px",
        minWidth: 0,
        background: "#fff",
        border: "1px solid #e9e9e9",
        borderRadius: 15,
        color: "#111",
        textDecoration: "none",
        transition: "border-color .2s, transform .2s",
      }}
    >
      {member.userId ? (
        <img
          src={`https://www.roblox.com/headshot-thumbnail/image?userId=${member.userId}&width=150&height=150&format=png`}
          alt={member.username}
          width={58}
          height={58}
          style={{ borderRadius: "50%", objectFit: "cover", background: "#eee" }}
        />
      ) : (
        <div style={{
          width: 58,
          height: 58,
          flexShrink: 0,
          borderRadius: "50%",
          background: "#eeeeee",
          display: "grid",
          placeItems: "center",
          fontWeight: 900,
          color: "#777",
          fontSize: 17,
        }}>
          {initials}
        </div>
      )}

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          flexWrap: "wrap",
        }}>
          <strong style={{ fontSize: 15 }}>{member.name}</strong>
          <span title="VMF verified" style={{
            color: "#4388ed",
            fontSize: 16,
          }}>✿</span>
        </div>
        <p style={{ color: "#777", fontSize: 12, marginTop: 5 }}>
          {member.title}
        </p>
        <p style={{ color: "#aaa", fontSize: 11, marginTop: 3 }}>
          @{member.username}
        </p>
      </div>

      <span style={{ color: "#777", fontSize: 18 }}>↗</span>
    </a>
  );
}

export default function AdministratorsPage() {
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

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 25,
          flexWrap: "wrap",
          fontSize: 13,
          fontWeight: 600,
        }}>
          <a href="/">Home</a>
          <a href="/teams">Teams</a>
          <a href="/administrators" style={{ borderBottom: "2px solid #111", paddingBottom: 8 }}>Administrators</a>
          <a href="/verify">Verification</a>
        </div>

        <a href="https://discord.com/" target="_blank" rel="noreferrer" style={{
          background: "#111",
          color: "#fff",
          borderRadius: 30,
          padding: "12px 19px",
          fontSize: 12,
          fontWeight: 700,
        }}>
          Join Our Discord ↗
        </a>
      </nav>

      <section style={{ maxWidth: 1500, margin: "auto", padding: "65px 5% 45px" }}>
        <p style={{
          fontSize: 11,
          letterSpacing: 5,
          fontWeight: 800,
          color: "#777",
        }}>
          THE VMF TEAM
        </p>

        <h1 style={{
          fontSize: "clamp(43px, 7vw, 78px)",
          letterSpacing: "-4px",
          fontWeight: 900,
          marginTop: 12,
        }}>
          ADMINISTRATORS<span style={{ color: "#aaa" }}>.</span>
        </h1>

        <p style={{ color: "#777", fontSize: 15, marginTop: 12 }}>
          Meet the people responsible for managing and developing VMF.
        </p>

        <div style={{
          height: 1,
          background: "#e7e7e7",
          margin: "38px 0 30px",
        }} />

        {groups.map((group) => (
          <section key={group.name} style={{ marginBottom: 32 }}>
            <div style={{
              background: "#111",
              color: "#fff",
              borderRadius: 15,
              padding: "17px 23px",
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginBottom: 14,
            }}>
              <span style={{ fontSize: 33, width: 48, textAlign: "center" }}>
                {group.icon}
              </span>

              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 21, fontWeight: 900 }}>
                  {group.name}
                </h2>
                <p style={{ color: "#ccc", fontSize: 12, marginTop: 3 }}>
                  {group.description}
                </p>
              </div>

              <span style={{
                background: "#333",
                borderRadius: 30,
                padding: "9px 13px",
                fontSize: 11,
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}>
                {group.members.length} MEMBERS
              </span>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 270px), 1fr))",
              gap: 12,
            }}>
              {group.members.map((member, index) => (
                <MemberCard
                  key={`${group.name}-${index}`}
                  member={member}
                />
              ))}
            </div>
          </section>
        ))}
      </section>

      <footer style={{
        borderTop: "1px solid #e9e9e9",
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
