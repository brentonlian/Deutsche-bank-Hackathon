/**
 * AI localization pipeline: drafts de/es/hi translations of the UI strings and the
 * region packs' user-facing text, protecting placeholders and glossary terms.
 *
 *   npm run localize            # translate missing languages
 *   npm run localize -- --force # retranslate everything
 *
 * Output is committed and reviewed by a native speaker; the app never translates at runtime.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getProvider, parseJson } from "../src/lib/ai/provider";
import { REGIONS } from "../src/lib/regions";
import { translatableRegionStrings } from "../src/lib/i18n";

const root = path.resolve(import.meta.dirname, "..");
const i18nDir = path.join(root, "src/content/i18n");
const force = process.argv.includes("--force");

loadEnv(path.join(root, ".env.local"));

const TARGETS = {
  de: "German. Address the reader informally with 'du', like a friendly modern German bank app.",
  es: "Mexican Spanish. Address the reader with 'tú'. Use vocabulary common in Mexico.",
  hi: "Hindi in Devanagari script. Address the reader respectfully with 'आप'. Use everyday Hindi, keep common English financial words people actually use in India (e.g. 'बैंक', 'EMI').",
} as const;

const glossary = [...new Set(["Rooted", ...Object.values(REGIONS).flatMap((r) => r.glossaryKeep)])];

const system = `You are a professional financial-education translator.
Rules:
- Return ONLY a JSON object with exactly the same keys and structure as the input.
- Never translate or alter placeholders in curly braces such as {income} or {country}.
- Keep these terms exactly as written, untranslated: ${glossary.join(", ")}.
- Use plain language a 14-year-old could follow. Keep sentences short.
- Keep the tone calm and encouraging. This is education, not financial advice.`;

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");

function flatten(obj: unknown, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof obj === "string") out[prefix] = obj;
  else if (obj && typeof obj === "object")
    for (const [k, v] of Object.entries(obj)) Object.assign(out, flatten(v, prefix ? `${prefix}.${k}` : k));
  return out;
}

function check(source: Record<string, string>, translated: Record<string, string>, label: string) {
  const problems: string[] = [];
  for (const [k, v] of Object.entries(source)) {
    if (!(k in translated)) problems.push(`missing ${k}`);
    else if (placeholders(v) !== placeholders(translated[k])) problems.push(`placeholders changed in ${k}`);
  }
  if (problems.length) console.warn(`  ${label}: ${problems.length} issue(s)\n   - ${problems.slice(0, 10).join("\n   - ")}`);
  return problems.length === 0;
}

async function main() {
  const llm = getProvider();
  if (!llm) throw new Error("No LLM provider configured. Set GEMINI_API_KEY (or LLM_PROVIDER=ollama) in .env.local");
  console.log(`Localizing with ${llm.name}`);
  const en = JSON.parse(readFileSync(path.join(i18nDir, "en.json"), "utf8"));
  mkdirSync(path.join(i18nDir, "regions"), { recursive: true });

  for (const [lang, style] of Object.entries(TARGETS)) {
    const uiFile = path.join(i18nDir, `${lang}.json`);
    if (force || !existsSync(uiFile) || readFileSync(uiFile, "utf8").trim() === "{}") {
      console.log(`- UI strings → ${lang}`);
      const out = parseJson<Record<string, unknown>>(
        await llm.generateJson({ system, prompt: `Translate the values of this JSON into ${style}\n\n${JSON.stringify(en)}` }),
      );
      check(flatten(en), flatten(out), `${lang} UI`);
      writeFileSync(uiFile, JSON.stringify(out, null, 2) + "\n");
    }

    const regionFile = path.join(i18nDir, "regions", `${lang}.json`);
    if (force || !existsSync(regionFile) || readFileSync(regionFile, "utf8").trim() === "{}") {
      const result: Record<string, Record<string, string>> = {};
      for (const region of Object.values(REGIONS)) {
        console.log(`- ${region.id} region pack → ${lang}`);
        const source = translatableRegionStrings(region);
        const out = parseJson<Record<string, string>>(
          await llm.generateJson({ system, prompt: `Translate the values of this JSON into ${style}\n\n${JSON.stringify(source)}` }),
        );
        check(source, out, `${lang} ${region.id}`);
        result[region.id] = out;
      }
      writeFileSync(regionFile, JSON.stringify(result, null, 2) + "\n");
    }
  }
  console.log("Done. Ask a native speaker to review the diff before merging.");
}

function loadEnv(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
