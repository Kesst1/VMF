"use client";

import { ReactNode, useEffect, useState } from "react";

export type Theme = "light" | "dark";
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("vmf-theme", theme);
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("vmf-theme");
    const theme: Theme = saved === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    setReady(true);
  }, []);
  return <div data-theme-ready={ready ? "true" : "false"}>{children}</div>;
}
