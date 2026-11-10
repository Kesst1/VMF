import type { Metadata } from "next";
import "./globals.css";
import { SiteShell } from "@/components/SiteShell";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = { title: "VMF — Virtual Modified Football", description: "The official VMF competition, teams, players and statistics platform.", icons: { icon: "/vmf-logo.png" } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ThemeProvider><SiteShell>{children}</SiteShell></ThemeProvider></body></html>;
}
