import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { isAdminSessionAuthorized } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("vmf_admin_session")?.value;
  const authorized = await isAdminSessionAuthorized(session);

  if (!authorized) {
    return (
      <main className="container" style={{ minHeight: "65vh", display: "grid", placeItems: "center", paddingTop: 60, paddingBottom: 60 }}>
        <section className="feature-card" style={{ width: "100%", maxWidth: 520, textAlign: "center", padding: 36 }}>
          <p className="eyebrow">VMF MANAGEMENT · RESTRICTED</p>
          <h1 style={{ fontSize: 34, margin: "12px 0" }}>Admin access only.</h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: 24 }}>
            Sign in with Discord. Access is limited to members with the Commissioner or Staff role in the official VMF server.
          </p>
          <a href="/api/admin/auth/login" className="admin-discord-login">Continue with Discord</a>
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 18 }}>Your Discord roles are checked securely by the server.</p>
        </section>
        <style>{`.admin-discord-login{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 24px;border-radius:10px;background:#5865f2;color:#fff;text-decoration:none;font-weight:800}.admin-discord-login:hover{background:#4752c4}`}</style>
      </main>
    );
  }

  return (
    <>
      <div className="container" style={{ display: "flex", justifyContent: "flex-end", paddingTop: 18 }}>
        <a href="/api/admin/auth/logout" style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>SIGN OUT ↗</a>
      </div>
      {children}
    </>
  );
}
