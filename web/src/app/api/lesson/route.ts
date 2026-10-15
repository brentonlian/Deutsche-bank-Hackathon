import { z } from "zod";
import { AGE_GROUPS } from "@/lib/game/engine";
import { LANG_IDS } from "@/lib/i18n";
import { TOPICS } from "@/lib/lessons";
import { getLesson } from "@/lib/lessons/server";
import { REGION_IDS } from "@/lib/regions";

const requestSchema = z.object({
  topic: z.enum(TOPICS),
  regionId: z.enum(REGION_IDS as [string, ...string[]]),
  lang: z.enum(LANG_IDS as [string, ...string[]]),
  group: z.enum(Object.keys(AGE_GROUPS) as [string, ...string[]]),
  simple: z.boolean(),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  try {
    const result = await getLesson(parsed.data as Parameters<typeof getLesson>[0]);
    if (!result) return Response.json({ error: "Lesson not available offline and no AI provider configured" }, { status: 503 });
    return Response.json(result);
  } catch (err) {
    console.error("lesson generation failed", err);
    return Response.json({ error: "Lesson generation failed" }, { status: 502 });
  }
}
