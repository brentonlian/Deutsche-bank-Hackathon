import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getProvider, parseJson } from "@/lib/ai/provider";
import type { AgeGroup } from "@/lib/game/types";
import type { Lang } from "@/lib/i18n";
import { REGIONS, type RegionId } from "@/lib/regions";
import { lessonCachePath, lessonPrompt, lessonSchema, type Lesson, type Topic } from ".";

const CACHE_DIR = path.join(process.cwd(), "src/content/lessons");

export interface LessonRequest {
  topic: Topic;
  regionId: RegionId;
  lang: Lang;
  group: AgeGroup;
  simple: boolean;
}

/** `lang` is the language actually served, which differs from the request when a fallback was used. */
export type LessonResult = { lesson: Lesson; lang: Lang; cached: boolean; model?: string };

/**
 * Lessons are generated once per (country, language, age group, topic, reading level) and saved.
 * Saved lessons are what a reviewer approves and what the offline demo serves.
 */
export async function getLesson(req: LessonRequest, opts: { allowGenerate?: boolean } = {}): Promise<LessonResult | null> {
  try {
    const exact = await getExactLesson(req, opts);
    if (exact) return exact;
  } catch (err) {
    // Generation failed (quota, network). Serve the closest saved lesson if there is one.
    const nearest = await nearestSaved(req);
    if (nearest) return nearest;
    throw err;
  }
  return nearestSaved(req);
}

/**
 * Closest saved lesson for the same country and topic: standard reading level first, then the same
 * language for another age group, then English, then the country's own languages.
 */
async function nearestSaved(req: LessonRequest): Promise<LessonResult | null> {
  const groups: AgeGroup[] = [req.group, ...(["young", "middle", "senior"] as AgeGroup[]).filter((g) => g !== req.group)];
  const langs = [...new Set<Lang>([req.lang, "en", ...(REGIONS[req.regionId].languages as Lang[])])];
  for (const lang of langs) {
    for (const group of groups) {
      const found = await getExactLesson({ ...req, lang, group, simple: false }, { allowGenerate: false });
      if (found) return found;
    }
  }
  return null;
}

async function getExactLesson(req: LessonRequest, opts: { allowGenerate?: boolean }): Promise<LessonResult | null> {
  const file = path.join(CACHE_DIR, lessonCachePath(req));
  try {
    return { lesson: lessonSchema.parse(JSON.parse(await readFile(file, "utf8"))), lang: req.lang, cached: true };
  } catch {
    // not cached yet (or invalid): fall through to generation
  }
  if (opts.allowGenerate === false) return null;

  const llm = getProvider();
  if (!llm) return null;
  const { system, prompt } = lessonPrompt({ ...req, region: REGIONS[req.regionId] });
  const lesson = lessonSchema.parse(parseJson(await llm.generateJson({ system, prompt })));

  try {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(lesson, null, 2) + "\n");
  } catch {
    // read-only filesystem (e.g. serverless): serve without caching
  }
  return { lesson, lang: req.lang, cached: false, model: llm.name };
}
