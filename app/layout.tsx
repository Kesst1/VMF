
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VMF | Virtual Match Football",
  description: "The official VMF football platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
