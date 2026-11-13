import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";

const links = [
  ["Overview", "/"], ["Competitions", "/competitions"], ["Fixtures", "/fixtures"], ["Admin Panel", "/admin/panel"],
  ["Standings", "/standings"], ["Teams", "/teams"], ["Players", "/players"],
  ["Statistics", "/stats"],
];

export function SiteShell({ children }: { children: ReactNode }) {
  return <><header className="topbar"><Link className="brand" href="/"><Image src="/vmf-logo.png" alt="VMF" width={46} height={46} style={{objectFit:"contain"}}/><span><b>VMF</b><small>VIRTUAL MODIFIED FOOTBALL</small></span></Link><nav>{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav><Link className="top-cta settings-cta" href="/settings">⚙ SETTINGS</Link></header>{children}<footer className="footer"><span>© {new Date().getFullYear()} VMF · VIRTUAL MODIFIED FOOTBALL</span><span>BUILT FOR THE GAME.</span></footer></>;
}

export function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><span className="empty-icon">✳</span><h3>{title}</h3><p>{detail}</p></div>;
}
