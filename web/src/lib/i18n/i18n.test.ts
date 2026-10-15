import { describe, expect, it } from "vitest";
import en from "@/content/i18n/en.json";
import de from "@/content/i18n/de.json";
import es from "@/content/i18n/es.json";
import hi from "@/content/i18n/hi.json";
import regionsDe from "@/content/i18n/regions/de.json";
import regionsEs from "@/content/i18n/regions/es.json";
import regionsHi from "@/content/i18n/regions/hi.json";
import { REGIONS, REGION_IDS } from "@/lib/regions";
import { localizeRegion, translatableRegionStrings, translate } from ".";

function flatten(obj: unknown, prefix = ""): Record<string, string> {
  if (typeof obj === "string") return { [prefix]: obj };
  return Object.entries(obj as Record<string, unknown>).reduce(
    (acc, [k, v]) => ({ ...acc, ...flatten(v, prefix ? `${prefix}.${k}` : k) }),
    {} as Record<string, string>,
  );
}
const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");

describe("translations", () => {
  const source = flatten(en);
  it.each([
    ["de", de],
    ["es", es],
    ["hi", hi],
  ])("%s has every key with the same placeholders", (_lang, messages) => {
    const target = flatten(messages);
    for (const [key, text] of Object.entries(source)) {
      expect(target[key], key).toBeDefined();
      expect(placeholders(target[key]), key).toBe(placeholders(text));
    }
  });

  it.each([
    ["de", regionsDe],
    ["es", regionsEs],
    ["hi", regionsHi],
  ])("%s region overlays cover every user-facing region string", (_lang, overlay) => {
    for (const id of REGION_IDS) {
      const keys = Object.keys(translatableRegionStrings(REGIONS[id]));
      const have = (overlay as Record<string, Record<string, string>>)[id] ?? {};
      for (const k of keys) expect(have[k], `${id} ${k}`).toBeDefined();
    }
  });

  it("keeps glossary terms like Schufa untranslated in German", () => {
    const de = localizeRegion(REGIONS.DE, "de");
    expect(JSON.stringify(de.culture.notes)).toContain("Schufa");
  });

  it("interpolates variables and falls back to English", () => {
    expect(translate("de", "game.age", { age: 30 })).toContain("30");
    expect(translate("hi", "missing.key")).toBe("missing.key");
  });
});
