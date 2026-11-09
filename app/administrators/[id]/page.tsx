
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Member = {
  id: string;
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

export default function AdministratorProfilePage() {
  const params = useParams();
  const id = String(params.id);

  const [member, setMember] = useState<Member | null>(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/administrators", {
          cache: "no-store",
        });

        const data: ApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to connect to VMF."
          );
        }

        let foundMember: Member | undefined;
        let foundRole = "";

        for (const group of data.groups) {
          const found = group.members.find(
            (person) => person.id === id
          );

          if (found) {
            foundMember = found;
            foundRole = group.name;
            break;
          }
        }

        if (!foundMember) {
          setError(
            "This member could not be found in the VMF directory."
          );
          return;
        }

        setMember(foundMember);
        setRole(foundRole);

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

    loadProfile();
  }, [id]);

  return (
    <main className="profile-page">
      <div className="profile-container">

        <header className="topbar">
          <a href="/" className="brand">
            <span className="brand-logo">VMF</span>
            <span className="brand-divider" />
            <span>VIRTUAL MODIFIED FOOTBALL</span>
          </a>

          <a href="/administrators" className="back-link">
            ← ADMINISTRATORS
          </a>
        </header>

        {loading ? (
          <div className="message">
            <div className="loader" />
            Loading member profile...
          </div>
        ) : error ? (
          <div className="message error">
            <h2>Member not found</h2>
            <p>{error}</p>
            <a href="/administrators">
              Return to administrators
            </a>
          </div>
        ) : member ? (
          <>
            <section className="profile-hero">

              <div className="eyebrow">
                <span />
                VMF OFFICIAL MEMBER
              </div>

              <div className="profile-card">

                <div className="avatar-frame">
                  <img
                    src={member.avatar}
                    alt={member.displayName}
                  />
                </div>

                <div className="profile-information">
                  <span className="profile-label">
                    MEMBER PROFILE
                  </span>

                  <h1>{member.displayName}</h1>

                  <p className="username">
                    @{member.username}
                  </p>

                  <div className="role-badge">
                    <span className="role-dot" />
                    {role}
                  </div>
                </div>

                <div className="profile-index">
                  <span>VMF</span>
                  <strong>MEMBER</strong>
                </div>

              </div>
            </section>

            <section className="details-section">

              <div className="section-heading">
                <span className="section-label">
                  MEMBER INFORMATION
                </span>

                <h2>Profile Details</h2>
              </div>

              <div className="details-grid">

                <div className="detail-item">
                  <span>DISPLAY NAME</span>
                  <strong>{member.displayName}</strong>
                </div>

                <div className="detail-item">
                  <span>DISCORD USERNAME</span>
                  <strong>@{member.username}</strong>
                </div>

                <div className="detail-item">
                  <span>VMF POSITION</span>
                  <strong>{role}</strong>
                </div>

                <div className="detail-item">
                  <span>DISCORD USER ID</span>
                  <strong className="user-id">
                    {member.id}
                  </strong>
                </div>

              </div>
            </section>
          </>
        ) : null}

        <footer className="footer">
          <span>© {new Date().getFullYear()} VMF</span>
          <span>VIRTUAL MODIFIED FOOTBALL</span>
          <a href="/administrators">
            BACK TO DIRECTORY ↑
          </a>
        </footer>

      </div>

      <style jsx>{`
        .profile-page {
          min-height: 100vh;
          background: #f7f7f7;
          color: #171717;
          font-family: Arial, Helvetica, sans-serif;
          padding: 0 24px;
        }

        .profile-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 28px 0;
          border-bottom: 1px solid #e5e5e5;
          gap: 15px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #171717;
          text-decoration: none;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .brand-logo {
          font-size: 23px;
          letter-spacing: -1px;
        }

        .brand-divider {
          height: 20px;
          width: 1px;
          background: #ccc;
        }

        .back-link {
          color: #777;
          text-decoration: none;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .back-link:hover,
        .footer a:hover {
          color: #111;
        }

        .profile-hero {
          padding: 85px 0 65px;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #888;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          margin-bottom: 22px;
        }

        .eyebrow span {
          width: 22px;
          height: 2px;
          background: #171717;
        }

        .profile-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 35px;
          min-height: 270px;
          padding: 45px;
          background: #171717;
          color: white;
          overflow: hidden;
          border-radius: 4px;
        }

        .profile-card::after {
          content: "VMF";
          position: absolute;
          right: 15px;
          bottom: -65px;
          font-size: 230px;
          font-weight: 900;
          letter-spacing: -20px;
          color: rgba(255,255,255,0.035);
          pointer-events: none;
        }

        .avatar-frame {
          width: 145px;
          height: 145px;
          flex-shrink: 0;
          padding: 5px;
          border: 1px solid #555;
          border-radius: 50%;
          position: relative;
          z-index: 1;
        }

        .avatar-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          background: #333;
        }

        .profile-information {
          position: relative;
          z-index: 1;
          min-width: 0;
        }

        .profile-label {
          color: #999;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .profile-information h1 {
          margin: 12px 0 5px;
          font-size: clamp(35px, 6vw, 57px);
          letter-spacing: -2.5px;
          line-height: 1;
          overflow-wrap: anywhere;
        }

        .username {
          color: #999;
          font-size: 14px;
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-top: 20px;
          padding: 9px 13px;
          border: 1px solid #454545;
          border-radius: 3px;
          color: #ddd;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .role-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #aaa;
        }

        .profile-index {
          position: absolute;
          right: 35px;
          top: 35px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
          z-index: 1;
        }

        .profile-index span {
          font-size: 25px;
          font-weight: 900;
        }

        .profile-index strong {
          color: #777;
          font-size: 8px;
          letter-spacing: 1px;
        }

        .details-section {
          padding-bottom: 65px;
        }

        .section-label {
          color: #999;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .section-heading h2 {
          margin-top: 8px;
          font-size: 25px;
          letter-spacing: -1px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 11px;
          padding: 23px;
          background: white;
          border: 1px solid #eaeaea;
          border-radius: 3px;
          min-width: 0;
        }

        .detail-item span {
          color: #999;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .detail-item strong {
          font-size: 14px;
          overflow-wrap: anywhere;
        }

        .user-id {
          font-size: 12px !important;
        }

        .message {
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 15px;
          color: #888;
          font-size: 13px;
          text-align: center;
        }

        .message h2 {
          color: #171717;
        }

        .message a {
          color: #171717;
        }

        .error {
          color: #9a4444;
        }

        .loader {
          width: 26px;
          height: 26px;
          border: 2px solid #ddd;
          border-top-color: #171717;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .footer {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 25px 0 35px;
          border-top: 1px solid #e5e5e5;
          color: #999;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .footer a {
          color: #555;
          text-decoration: none;
        }

        @media (max-width: 650px) {
          .profile-page {
            padding: 0 14px;
          }

          .profile-hero {
            padding: 60px 0 45px;
          }

          .profile-card {
            flex-direction: column;
            align-items: flex-start;
            padding: 30px 22px;
            gap: 22px;
          }

          .avatar-frame {
            width: 110px;
            height: 110px;
          }

          .profile-index {
            right: 20px;
            top: 20px;
          }

          .profile-index span {
            font-size: 19px;
          }

          .profile-card::after {
            font-size: 150px;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .brand {
            font-size: 7px;
          }

          .footer {
            font-size: 7px;
          }
        }
      `}</style>
    </main>
  );
}
