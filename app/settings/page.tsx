"use client";

import { useEffect, useState } from "react";
import { PageHeading } from "@/components/SiteShell";
import { applyTheme, Theme } from "@/components/ThemeProvider";

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [compact, setCompact] = useState(false);
  const [animations, setAnimations] = useState(true);
  useEffect(() => {
    setTheme(localStorage.getItem("vmf-theme") === "dark" ? "dark" : "light");
    setCompact(localStorage.getItem("vmf-compact") === "true");
    setAnimations(localStorage.getItem("vmf-animations") !== "false");
  }, []);
  function changeTheme(next: Theme) { setTheme(next); applyTheme(next); }
  function changeCompact(next: boolean) { setCompact(next); localStorage.setItem("vmf-compact", String(next)); document.documentElement.classList.toggle("compact-mode", next); }
  function changeAnimations(next: boolean) { setAnimations(next); localStorage.setItem("vmf-animations", String(next)); document.documentElement.classList.toggle("reduce-motion", !next); }
  return <main className="container"><PageHeading eyebrow="PREFERENCES" title="Settings." description="Personalise how the VMF platform looks and feels. Your preferences are saved on this device." />
    <section className="settings-layout">
      <article className="settings-card"><div className="settings-card-heading"><span className="settings-icon">◐</span><div><h2>Appearance</h2><p>Choose the theme used across the VMF website.</p></div></div>
        <div className="theme-options">
          <button type="button" className={`theme-option ${theme === "light" ? "selected" : ""}`} onClick={() => changeTheme("light")}><span className="theme-preview light-preview"><i/><i/><i/></span><span><b>Light theme</b><small>Clean white appearance</small></span><span className="radio-dot"/></button>
          <button type="button" className={`theme-option ${theme === "dark" ? "selected" : ""}`} onClick={() => changeTheme("dark")}><span className="theme-preview dark-preview"><i/><i/><i/></span><span><b>Dark theme</b><small>Discord-inspired dark grey</small></span><span className="radio-dot"/></button>
        </div>
      </article>
      <article className="settings-card"><div className="settings-card-heading"><span className="settings-icon">☷</span><div><h2>Interface</h2><p>Adjust the way information is displayed.</p></div></div>
        <label className="setting-row"><span><b>Compact tables</b><small>Reduce spacing in fixture and data tables.</small></span><input type="checkbox" checked={compact} onChange={e => changeCompact(e.target.checked)} /></label>
        <label className="setting-row"><span><b>Interface animations</b><small>Enable subtle hover and transition effects.</small></span><input type="checkbox" checked={animations} onChange={e => changeAnimations(e.target.checked)} /></label>
      </article>
      <article className="settings-card settings-about"><div className="settings-card-heading"><span className="settings-icon">ⓘ</span><div><h2>About VMF</h2><p>Virtual Modified Football · Official platform</p></div></div><p className="settings-note">These settings are stored locally in your browser. They do not change your VMF account or competition data.</p></article>
    </section></main>;
}
