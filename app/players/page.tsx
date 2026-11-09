
"use client";

import { useEffect, useMemo, useState } from "react";

type Member = {
  id: string;
  robloxId: string;
  username: string;
  displayName: string;
  avatar: string;
};

type RoleGroup = {
  name: string;
  roleId: string;
  members: Member[];
};

type ApiResponse = {
  groups: RoleGroup[];
  totalMembers: number;
  error?: string;
};

export default function PlayersPage() {
  const [groups, setGroups] = useState<RoleGroup[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  async function loadMembers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/administrators", {
        cache: "no-store",
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load Discord members.");
      }

      setGroups(data.groups || []);
      setTotalMembers(data.totalMembers || 0);

      setLastUpdated(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    return groups.map((group) => ({
      ...group,
      members: group.members.filter((member) =>
        member.displayName.toLowerCase().includes(query) ||
        member.username.toLowerCase().includes(query) ||
        member.robloxId.includes(query)
      ),
    }));
  }, [groups, search]);

  const visibleMembers = filteredGroups.reduce(
    (total, group) => total + group.members.length,
    0
  );

  return (
    <main className="admin-page">
      <div className="admin-container">

        <header className="admin-header">
          <div className="header-top">
            <a href="/" className="brand">
              <span className="brand-mark">VMF</span>
              <span className="brand-divider" />
              <span className="brand-name">
                VIRTUAL MODIFIED FOOTBALL
              </span>
            </a>

            <span className="directory-label">
              OFFICIAL DIRECTORY
            </span>
          </div>

          <div className="hero">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              VMF ORGANISATION
            </div>

            <h1>
              Meet the <span>Team.</span>
            </h1>

            <p className="hero-description">
              The players and staff who make up Virtual Modified Football.
              Discover the team responsible for managing,
              developing and supporting our community.
            </p>
          </div>
        </header>

        <section className="directory-section">

          <div className="directory-top">
            <div>
              <div className="section-label">OUR PEOPLE</div>
              <h2>Players Directory</h2>
              <p className="section-description">
                Official members organised by their highest
                assigned Discord role.
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={loadMembers}
              disabled={loading}
            >
              <span className={loading ? "refresh-icon spinning" : "refresh-icon"}>
                ↻
              </span>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">TOTAL MEMBERS</span>
              <strong>{loading ? "—" : totalMembers}</strong>
              <span className="stat-caption">Discord directory</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">VISIBLE MEMBERS</span>
              <strong>{loading ? "—" : visibleMembers}</strong>
              <span className="stat-caption">Matching your search</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">ROLE CATEGORIES</span>
              <strong>{groups.length || "—"}</strong>
              <span className="stat-caption">Official role structure</span>
            </div>
          </div>

          <div className="directory-controls">
            <div className="search-box">
              <span className="search-icon">⌕</span>

              <input
                type="text"
                placeholder="Search by username or Roblox ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {search && (
                <button
                  className="clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <span className="directory-count">
              {visibleMembers} MEMBERS FOUND
            </span>
          </div>

          {error && (
            <div className="error-panel">
              <strong>Unable to load the directory</strong>
              <p>{error}</p>
              <button onClick={loadMembers}>Try again</button>
            </div>
          )}

          {loading && !error && (
            <div className="loading-panel">
              <div className="loader" />
              <span>Loading the VMF directory...</span>
            </div>
          )}

          {!loading && !error && (
            <div className="groups-list">

              {filteredGroups.map((group, index) => (
                <section className="role-section" key={group.roleId}>

                  <div className="role-heading">
                    <div className="role-heading-left">
                      <span className="role-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <h3>{group.name}</h3>
                    </div>

                    <span className="role-count">
                      {group.members.length} MEMBERS
                    </span>
                  </div>

                  {group.members.length > 0 ? (
                    <div className="members-grid">
                      {group.members.map((member) => (
                        <a
                          className="member-card"
                          key={member.id}
                          href={`/players/${member.id}`}
                        >
                          <div className="member-avatar-wrap">
                            <img
                              className="member-avatar"
                              src={member.avatar}
                              alt={member.displayName}
                              loading="lazy"
                            />

                            <span className="member-status" />
                          </div>

                          <div className="member-info">
                            <strong>{member.displayName}</strong>
                            <span>@{member.username}</span>
                            <span className="roblox-id">Roblox ID: {member.robloxId}</span>
                          </div>

                          <span className="member-arrow">↗</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-role">
                      No members assigned to this category.
                    </div>
                  )}

                </section>
              ))}

              {visibleMembers === 0 && (
                <div className="empty-role">
                  {search
                    ? `No members match "${search}".`
                    : "No members found in the directory."}
                </div>
              )}

            </div>
          )}

          <div className="directory-footer">
            <div className="footer-status">
              <span className="status-dot" />
              {error
                ? "CONNECTION ERROR"
                : loading
                  ? "CONNECTING"
                  : "DIRECTORY CONNECTED"}
            </div>

            <span>
              {lastUpdated
                ? `LAST UPDATED ${lastUpdated}`
                : "VIRTUAL MODIFIED FOOTBALL"}
            </span>
          </div>

        </section>

        <footer className="page-footer">
          <span>© {new Date().getFullYear()} VMF</span>
          <span>VIRTUAL MODIFIED FOOTBALL</span>
          <a href="/">BACK TO HOME ↑</a>
        </footer>

      </div>

      <style jsx>{`
        .admin-page {
          min-height: 100vh;
          background: #f7f7f7;
          color: #151515;
          font-family: Arial, Helvetica, sans-serif;
          padding: 0 24px;
        }

        .admin-container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .admin-header {
          padding-top: 30px;
        }

        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 25px;
          border-bottom: 1px solid #e5e5e5;
          gap: 15px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #151515;
        }

        .brand-mark {
          font-size: 23px;
          font-weight: 900;
          letter-spacing: -1.5px;
        }

        .brand-divider {
          height: 21px;
          width: 1px;
          background: #d4d4d4;
        }

        .brand-name,
        .directory-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .directory-label {
          color: #777;
        }

        .hero {
          padding: 85px 0 75px;
          max-width: 700px;
        }

        .eyebrow,
        .section-label {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #777;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .eyebrow-line {
          height: 2px;
          width: 24px;
          background: #171717;
        }

        .hero h1 {
          font-size: clamp(48px, 8vw, 82px);
          line-height: 0.98;
          letter-spacing: -5px;
          margin: 22px 0;
          font-weight: 900;
        }

        .hero h1 span {
          color: #a5a5a5;
        }

        .hero-description {
          max-width: 490px;
          color: #777;
          font-size: 14px;
          line-height: 1.8;
        }

        .directory-section {
          background: #fff;
          border: 1px solid #e9e9e9;
          border-radius: 5px;
          padding: 34px;
        }

        .directory-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .directory-top h2 {
          font-size: 25px;
          letter-spacing: -0.8px;
          margin: 10px 0 7px;
        }

        .section-description {
          color: #888;
          font-size: 12px;
          line-height: 1.6;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 11px 16px;
          background: #171717;
          border: 1px solid #171717;
          color: white;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .refresh-button:hover {
          background: #393939;
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .refresh-icon {
          font-size: 17px;
        }

        .spinning {
          display: inline-block;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin: 30px 0;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 19px;
          background: #f7f7f7;
          border: 1px solid #ededed;
          border-radius: 3px;
        }

        .stat-label {
          color: #888;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .stat-card strong {
          font-size: 30px;
          letter-spacing: -1px;
        }

        .stat-caption {
          color: #999;
          font-size: 10px;
        }

        .directory-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 17px 0;
          border-top: 1px solid #ededed;
          border-bottom: 1px solid #ededed;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          max-width: 420px;
        }

        .search-icon {
          color: #888;
          font-size: 22px;
        }

        .search-box input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #171717;
          font-size: 12px;
        }

        .clear-search {
          border: 0;
          background: transparent;
          font-size: 19px;
          cursor: pointer;
          color: #777;
        }

        .directory-count {
          color: #999;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .groups-list {
          padding-top: 12px;
        }

        .role-section {
          padding: 23px 0;
          border-bottom: 1px solid #ededed;
        }

        .role-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: #191919;
          color: white;
          padding: 15px 17px;
          border-radius: 3px;
          margin-bottom: 14px;
        }

        .role-heading-left {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .role-number {
          color: #999;
          font-size: 10px;
          font-weight: 800;
        }

        .role-heading h3 {
          margin: 0;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .role-count {
          color: #aaa;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.8px;
        }

        .members-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .member-card {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
          padding: 13px;
          border: 1px solid #ededed;
          border-radius: 3px;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }

        .member-card:hover {
          border-color: #999;
          background: #fafafa;
        }

        .member-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .member-avatar {
          display: block;
          width: 43px;
          height: 43px;
          border-radius: 50%;
          object-fit: cover;
          background: #e9e9e9;
        }

        .member-status {
          position: absolute;
          right: 0;
          bottom: 1px;
          width: 9px;
          height: 9px;
          background: #777;
          border: 2px solid white;
          border-radius: 50%;
        }

        .member-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
          flex: 1;
        }

        .member-info strong {
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .member-info span {
          color: #999;
          font-size: 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .member-info .roblox-id {
          color: #666;
          font-size: 9px;
          font-weight: 700;
        }

        .member-arrow {
          color: #aaa;
          font-size: 15px;
        }

        .empty-role {
          padding: 20px;
          border: 1px dashed #ddd;
          border-radius: 3px;
          text-align: center;
          color: #999;
          font-size: 11px;
        }

        .loading-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          padding: 65px 20px;
          color: #888;
          font-size: 12px;
        }

        .loader {
          width: 25px;
          height: 25px;
          border: 2px solid #e5e5e5;
          border-top-color: #171717;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .error-panel {
          margin-top: 25px;
          padding: 20px;
          border: 1px solid #e6caca;
          background: #fffafa;
          color: #8d3434;
          font-size: 12px;
        }

        .error-panel p {
          line-height: 1.6;
        }

        .error-panel button {
          padding: 9px 13px;
          background: #171717;
          border: 0;
          color: white;
          cursor: pointer;
        }

        .directory-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding-top: 25px;
          color: #999;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.8px;
        }

        .footer-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #777;
        }

        .page-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 25px 0 35px;
          color: #999;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .page-footer a {
          color: #555;
          text-decoration: none;
        }

        @media (max-width: 650px) {
          .admin-page {
            padding: 0 14px;
          }

          .brand-name {
            font-size: 7px;
            letter-spacing: 0.7px;
          }

          .directory-label {
            font-size: 7px;
          }

          .hero {
            padding: 65px 0 55px;
          }

          .hero h1 {
            letter-spacing: -3px;
          }

          .directory-section {
            padding: 20px 15px;
          }

          .directory-top {
            align-items: flex-start;
          }

          .directory-top h2 {
            font-size: 20px;
          }

          .refresh-button {
            padding: 10px;
            font-size: 10px;
          }

          .stats-grid {
            gap: 7px;
          }

          .stat-card {
            padding: 12px 9px;
          }

          .stat-label {
            font-size: 7px;
            letter-spacing: 0.4px;
          }

          .stat-card strong {
            font-size: 24px;
          }

          .stat-caption {
            font-size: 8px;
          }

          .members-grid {
            grid-template-columns: 1fr;
          }

          .directory-controls {
            align-items: flex-start;
            flex-direction: column;
          }

          .directory-count {
            align-self: flex-end;
          }

          .directory-footer,
          .page-footer {
            font-size: 8px;
          }
        }
      `}</style>
    </main>
  );
}
