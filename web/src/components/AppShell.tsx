"use client";

import { Palette } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LANGUAGES, LANG_IDS, isLang } from "@/lib/i18n";
import { THEMES, useApp } from "./AppState";

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5 text-xl font-extrabold tracking-[-0.02em]">
      <svg width="34" height="18" viewBox="0 0 34 18" aria-hidden="true">
        <path d="M2 9h30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <circle cx="9" cy="9" r="6" fill="var(--ground)" stroke="currentColor" strokeWidth="3" />
        <circle cx="25" cy="9" r="6" fill="var(--ground)" stroke="currentColor" strokeWidth="3" />
      </svg>
      Rooted
    </span>
  );
}

/** Colour scheme picker: light, dark, high contrast or calm. Country line colours stay the same. */
function ThemeMenu() {
  const { settings, setSettings, t } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-sign border-2 border-line-ink/40 px-2 py-1.5 font-bold hover:bg-line-ink/15"
      >
        <Palette aria-hidden="true" size={18} /> {t("theme.button")}
      </button>
      {open && (
        <div role="radiogroup" aria-label={t("theme.button")} className="absolute right-0 top-full z-30 mt-2 w-56 rounded-sign border-2 border-ink bg-ground p-2 text-ink shadow-[0_8px_24px_rgb(0_0_0/0.18)]">
          {THEMES.map((th) => (
            <button
              key={th}
              type="button"
              role="radio"
              aria-checked={settings.theme === th}
              data-theme-preview={th}
              onClick={() => {
                setSettings({ theme: th });
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-sign px-3 py-2 text-left font-bold ${settings.theme === th ? "bg-ink text-ground" : "hover:bg-panel"}`}
            >
              <span aria-hidden="true" className={`size-5 shrink-0 rounded-full border-2 border-current theme-swatch-${th}`} />
              {t(`theme.${th}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, region, lang, setLang, settings, setSettings, reset, t } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const navLink = (href: string, label: string) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`rounded-sign px-3 py-2 font-bold ${active ? "bg-line-ink text-line" : "hover:bg-line-ink/15"}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-ground">
        {t("nav.skip")}
      </a>
      <header className="bg-line text-line-ink transition-colors duration-500">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Link href={profile ? "/learn" : "/"} className="mr-2 rounded-sign" aria-label="Rooted">
            <Wordmark />
          </Link>
          {profile && (
            <nav aria-label="Main" className="flex flex-wrap gap-1">
              {navLink("/learn", t("nav.learn"))}
              {navLink("/tools", t("nav.tools"))}
              {navLink("/play", t("nav.play"))}
            </nav>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
            {region && <span className="hidden font-bold sm:inline">{profile?.city ? `${profile.city}, ${region.name}` : region.name}</span>}
            <label className="flex items-center gap-1.5">
              <span className="sr-only">{t("nav.language")}</span>
              <select
                value={lang}
                onChange={(e) => isLang(e.target.value) && setLang(e.target.value)}
                className="rounded-sign border-2 border-line-ink/40 bg-line px-2 py-1.5 font-bold text-line-ink"
              >
                {LANG_IDS.map((l) => (
                  <option key={l} value={l} className="bg-ground text-ink">
                    {LANGUAGES[l].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-sign px-2 py-1.5 font-bold hover:bg-line-ink/15">
              <input type="checkbox" checked={settings.simple} onChange={(e) => setSettings({ simple: e.target.checked })} className="size-4 accent-current" />
              {t("nav.simple")}
            </label>
            {profile && (
              <button
                type="button"
                onClick={() => {
                  reset();
                  router.push("/");
                }}
                className="rounded-sign px-2 py-1.5 font-bold underline hover:bg-line-ink/15"
              >
                {t("nav.restart")}
              </button>
            )}
            <ThemeMenu />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        {children}
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-sm text-ink-3 sm:px-6">{t("app.disclaimer")}</footer>
    </>
  );
}
