import en from "@/content/i18n/en.json";
import de from "@/content/i18n/de.json";
import es from "@/content/i18n/es.json";
import hi from "@/content/i18n/hi.json";
import regionsDe from "@/content/i18n/regions/de.json";
import regionsEs from "@/content/i18n/regions/es.json";
import regionsHi from "@/content/i18n/regions/hi.json";
import type { RegionPack } from "@/lib/regions/schema";

export const LANGUAGES = {
  en: { label: "English", bcp47: "en", dir: "ltr" },
  de: { label: "Deutsch", bcp47: "de", dir: "ltr" },
  es: { label: "Español", bcp47: "es", dir: "ltr" },
  hi: { label: "हिन्दी", bcp47: "hi", dir: "ltr" },
} as const;

export type Lang = keyof typeof LANGUAGES;
export const LANG_IDS = Object.keys(LANGUAGES) as Lang[];
export const isLang = (v: string): v is Lang => v in LANGUAGES;

type Messages = Record<string, unknown>;
const MESSAGES: Record<Lang, Messages> = { en, de, es, hi };

/** Machine-drafted translations of region-pack text, keyed by region then JSON path. */
const REGION_TEXT: Partial<Record<Lang, Record<string, Record<string, string>>>> = {
  de: regionsDe,
  es: regionsEs,
  hi: regionsHi,
};

function lookup(messages: Messages, key: string): string | undefined {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && part in node) node = (node as Record<string, unknown>)[part];
    else return undefined;
  }
  return typeof node === "string" ? node : undefined;
}

export type Vars = Record<string, string | number>;

/** Translate a key, falling back to English, then to the key itself so gaps are visible. */
export function translate(lang: Lang, key: string, vars?: Vars): string {
  const template = lookup(MESSAGES[lang], key) ?? lookup(MESSAGES.en, key) ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

export const hasKey = (key: string) => lookup(MESSAGES.en, key) !== undefined;

/** Return a copy of the region pack with its user-facing text in the given language. */
export function localizeRegion(region: RegionPack, lang: Lang): RegionPack {
  const overlay = REGION_TEXT[lang]?.[region.id];
  if (!overlay) return region;
  const copy = structuredClone(region) as unknown as Record<string, unknown>;
  for (const [path, value] of Object.entries(overlay)) {
    const parts = path.split(".");
    let node = copy as Record<string, unknown>;
    for (const p of parts.slice(0, -1)) node = node[p] as Record<string, unknown>;
    if (node && typeof node[parts.at(-1)!] === "string") node[parts.at(-1)!] = value;
  }
  return copy as unknown as RegionPack;
}

/** Region-pack fields that are user-facing prose (everything else is ids, codes, names to keep, or numbers). */
const SKIP_FIELDS = new Set([
  "id", "flag", "locale", "currency", "languages", "source", "sources", "verified", "worldBankCode",
  "glossaryKeep", "paymentRails", "creditBureau", "centralBank", "regulator", "sender", "channel", "liquidity", "risk",
]);

export function translatableRegionStrings(region: RegionPack): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (node: unknown, path: string[]) => {
    if (typeof node === "string") {
      out[path.join(".")] = node;
    } else if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, [...path, String(i)]));
    } else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) if (!SKIP_FIELDS.has(k)) walk(v, [...path, k]);
    }
  };
  walk(region, []);
  return out;
}
