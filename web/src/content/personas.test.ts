import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AGE_GROUPS, createContext, optimalPath } from "@/lib/game/engine";
import { lessonCachePath, lessonSchema, regionFacts } from "@/lib/lessons";
import { REGIONS } from "@/lib/regions";
import { PERSONAS } from "./personas";

const lessonsDir = path.join(__dirname, "lessons");

describe("demo personas", () => {
  it.each(PERSONAS.map((p) => [p.id, p] as const))("%s has a valid profile and a playable game", (_id, p) => {
    const { min, max } = AGE_GROUPS[p.group];
    expect(p.age).toBeGreaterThanOrEqual(min);
    expect(p.age).toBeLessThanOrEqual(max);
    const ctx = createContext(REGIONS[p.regionId], p.group, p.age, p.income, p.seed);
    expect(optimalPath(ctx).path).toHaveLength(ctx.stages.length);
  });

  it.each(PERSONAS.flatMap((p) => p.topics.map((topic) => [p.id, topic, p] as const)))(
    "%s has a saved %s lesson that only cites real facts",
    (_id, topic, p) => {
      const file = path.join(lessonsDir, lessonCachePath({ regionId: p.regionId, lang: p.lang, group: p.group, topic, simple: false }));
      const lesson = lessonSchema.parse(JSON.parse(readFileSync(file, "utf8")));
      const known = new Set(regionFacts(REGIONS[p.regionId]).map((f) => f.key));
      for (const key of lesson.factsUsed) expect(known.has(key), key).toBe(true);
    },
  );
});
