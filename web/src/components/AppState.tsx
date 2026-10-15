"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { createLocalStore, hydrationStore } from "@/lib/storage";
import type { AgeGroup } from "@/lib/game/types";
import { LANGUAGES, isLang, localizeRegion, translate, type Lang, type Vars } from "@/lib/i18n";
import { REGIONS, isRegionId, type RegionId } from "@/lib/regions";
import type { RegionPack } from "@/lib/regions/schema";

export interface Profile {
  regionId: RegionId;
  lang: Lang;
  group: AgeGroup;
  age: number;
  income: number;
  free: number;
  /** Set when playing one of the hardcoded demo personas. */
  personaId?: string;
}

export interface GameSave {
  seed: number;
  choices: string[];
}

interface Settings {
  simple: boolean;
}

interface AppState {
  ready: boolean;
  profile: Profile | null;
  game: GameSave | null;
  settings: Settings;
  /** Language used for the UI (profile language, or a pre-onboarding choice). */
  lang: Lang;
  region: RegionPack | null;
  setProfile: (p: Profile) => void;
  updateProfile: (p: Partial<Profile>) => void;
  setLang: (l: Lang) => void;
  setGame: (g: GameSave | null) => void;
  setSettings: (s: Partial<Settings>) => void;
  reset: () => void;
  t: (key: string, vars?: Vars) => string;
  money: (value: number, opts?: { compact?: boolean }) => string;
  percent: (value: number) => string;
}

const Ctx = createContext<AppState | null>(null);
const KEY = "rooted:v1";

interface Stored {
  profile: Profile | null;
  game: GameSave | null;
  settings: Settings;
  lang?: Lang;
}

const EMPTY: Stored = { profile: null, game: null, settings: { simple: false } };

const store = createLocalStore<Stored>(KEY, EMPTY, (raw) => {
  const parsed = raw as Stored;
  const profileOk = parsed.profile && isRegionId(parsed.profile.regionId) && isLang(parsed.profile.lang);
  return {
    profile: profileOk ? parsed.profile : null,
    game: profileOk ? (parsed.game ?? null) : null,
    settings: parsed.settings ?? { simple: false },
    lang: parsed.lang && isLang(parsed.lang) ? parsed.lang : undefined,
  };
});

export function AppStateProvider({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(hydrationStore.subscribe, hydrationStore.getSnapshot, hydrationStore.getServerSnapshot);
  const stored = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const setStored = store.update;

  const lang: Lang = stored.profile?.lang ?? stored.lang ?? "en";
  const region = useMemo(
    () => (stored.profile ? localizeRegion(REGIONS[stored.profile.regionId], lang) : null),
    [stored.profile, lang],
  );

  useEffect(() => {
    document.documentElement.lang = LANGUAGES[lang].bcp47;
    document.documentElement.dir = LANGUAGES[lang].dir;
    if (stored.profile) document.body.dataset.region = stored.profile.regionId;
    else delete document.body.dataset.region;
  }, [lang, stored.profile]);

  const t = useCallback((key: string, vars?: Vars) => translate(lang, key, vars), [lang]);

  const numberLocale = region ? `${LANGUAGES[lang].bcp47}-${region.id}` : LANGUAGES[lang].bcp47;
  const money = useCallback(
    (value: number, opts?: { compact?: boolean }) =>
      new Intl.NumberFormat(numberLocale, {
        style: "currency",
        currency: region?.currency ?? "EUR",
        maximumFractionDigits: 0,
        notation: opts?.compact ? "compact" : "standard",
      }).format(value),
    [numberLocale, region?.currency],
  );
  const percent = useCallback(
    (value: number) => new Intl.NumberFormat(numberLocale, { style: "percent", maximumFractionDigits: 1 }).format(value / 100),
    [numberLocale],
  );

  const value: AppState = {
    ready,
    profile: stored.profile,
    game: stored.game,
    settings: stored.settings,
    lang,
    region,
    setProfile: (profile) => setStored((s) => ({ ...s, profile, game: null })),
    updateProfile: (p) => setStored((s) => (s.profile ? { ...s, profile: { ...s.profile, ...p } } : s)),
    setLang: (l) => setStored((s) => ({ ...s, lang: l, profile: s.profile ? { ...s.profile, lang: l } : null })),
    setGame: (game) => setStored((s) => ({ ...s, game })),
    setSettings: (p) => setStored((s) => ({ ...s, settings: { ...s.settings, ...p } })),
    reset: () => setStored((s) => ({ profile: null, game: null, settings: s.settings, lang: s.profile?.lang ?? s.lang })),
    t,
    money,
    percent,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppStateProvider");
  return ctx;
}
