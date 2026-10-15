/**
 * Pre-generates lessons into src/content/lessons so the demo works offline and a reviewer
 * can approve them before they ship.
 *
 *   npm run lessons                                   # demo set: every country, its languages + English, young adults
 *   npm run lessons -- --groups young,senior --topics budgeting,scams-and-fraud --simple
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { AGE_GROUPS } from "../src/lib/game/engine";
import type { AgeGroup } from "../src/lib/game/types";
import { isLang, type Lang } from "../src/lib/i18n";
import { TOPICS, isTopic, type Topic } from "../src/lib/lessons";
import { getLesson } from "../src/lib/lessons/server";
import { REGIONS, REGION_IDS, type RegionId } from "../src/lib/regions";

const root = path.resolve(import.meta.dirname, "..");
loadEnv(path.join(root, ".env.local"));

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1]?.split(",") : undefined;
};

const regions = (arg("regions") ?? REGION_IDS) as RegionId[];
const groups = (arg("groups") ?? ["young"]).filter((g): g is AgeGroup => g in AGE_GROUPS);
const topics = (arg("topics") ?? [...TOPICS]).filter(isTopic) as Topic[];
const simple = process.argv.includes("--simple");

const jobs = regions.flatMap((regionId) => {
  const langs = (arg("langs") ?? ["en", ...REGIONS[regionId].languages]).filter(isLang) as Lang[];
  return [...new Set(langs)].flatMap((lang) =>
    groups.flatMap((group) => topics.map((topic) => ({ regionId, lang, group, topic, simple }))),
  );
});

async function main() {
  console.log(`${jobs.length} lessons to check`);
  let done = 0;
  let generated = 0;
  const failed: string[] = [];
  // One request at a time, paced and retried, keeps us inside free-tier per-minute limits.
  for (const job of jobs) {
    const label = `${job.regionId}/${job.lang}/${job.group}/${job.topic}${job.simple ? "/simple" : ""}`;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const r = await getLesson(job);
        if (r && !r.cached) {
          generated++;
          await sleep(PACE_MS);
        }
        if (!r) failed.push(`${label} (no provider)`);
        break;
      } catch (err) {
        const message = (err as Error).message;
        if (/429|503|quota|RESOURCE_EXHAUSTED|UNAVAILABLE|high demand/i.test(message) && attempt < 5) {
          console.log(`  rate limited on ${label}, waiting ${attempt * 20}s`);
          await sleep(attempt * 20_000);
          continue;
        }
        failed.push(`${label}: ${message.slice(0, 120)}`);
        break;
      }
    }
    done++;
    if (done % 5 === 0 || done === jobs.length) console.log(`  ${done}/${jobs.length} (${generated} generated)`);
  }
  if (failed.length) console.warn(`Failed:\n - ${failed.join("\n - ")}`);
  console.log("Done.");
}

const PACE_MS = 7_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
