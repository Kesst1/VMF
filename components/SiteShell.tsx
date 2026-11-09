import Link from "next/link";
import { ReactNode } from "react";

const links = [
  ["Overview", "/"], ["Competitions", "/competitions"], ["Fixtures", "/fixtures"],
  ["Standings", "/standings"], ["Teams", "/teams"], ["Players", "/players"],
  ["Statistics", "/stats"], ["Administrators", "/administrators"],
];

export function SiteShell({ children }: { children: ReactNode }) {
  return <><header className="topbar"><Link className="brand" href="/"><span className="brand-mark">VMF</span><span><b>VMF</b><small>VIRTUAL MODIFIED FOOTBALL</small></span></Link><nav>{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav><Link className="top-cta" href="/players">Explore VMF <span>↗</span></Link></header>{children}<footer className="footer"><span>© {new Date().getFullYear()} VMF · VIRTUAL MODIFIED FOOTBALL</span><span>BUILT FOR THE GAME.</span></footer></>;
}

export function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><span className="empty-icon">✳</span><h3>{title}</h3><p>{detail}</p></div>;
}
 
