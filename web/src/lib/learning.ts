import { getPersona } from "@/content/personas";
import type { AgeGroup } from "@/lib/game/types";
import type { Topic } from "@/lib/lessons";

export const TOOLS = ["budget", "growth", "debt"] as const;
export type ToolId = (typeof TOOLS)[number];
export const isTool = (v: string): v is ToolId => (TOOLS as readonly string[]).includes(v);

/** Lessons a custom (non-persona) profile starts with, by stage of life. */
const DEFAULT_TOPICS: Record<AgeGroup, [Topic, Topic]> = {
  young: ["budgeting", "credit-and-debt"],
  middle: ["budgeting", "scams-and-fraud"],
  senior: ["retirement", "scams-and-fraud"],
};

/** The calculator that best practises each topic. */
const TOOL_FOR_TOPIC: Partial<Record<Topic, ToolId>> = {
  budgeting: "budget",
  "emergency-fund": "budget",
  "credit-and-debt": "debt",
  "saving-vs-investing": "growth",
  inflation: "growth",
  retirement: "growth",
};

export type Station =
  | { key: "guide"; kind: "guide"; href: string }
  | { key: `lesson:${string}`; kind: "lesson"; topic: Topic; href: string }
  | { key: `tool:${string}`; kind: "tool"; tool: ToolId; href: string }
  | { key: "game"; kind: "game"; href: string };

export function lessonTopics(profile: { personaId?: string; group: AgeGroup }): [Topic, Topic] {
  return getPersona(profile.personaId)?.topics ?? DEFAULT_TOPICS[profile.group];
}

/**
 * The learning line: understand your country's money system, learn and test two topics, practise
 * each with a calculator on your own numbers, then try it all in the Life Path game.
 */
export function learningLine(profile: { personaId?: string; group: AgeGroup }): Station[] {
  const [a, b] = lessonTopics(profile);
  const toolA = TOOL_FOR_TOPIC[a] ?? "budget";
  const toolB = TOOL_FOR_TOPIC[b] && TOOL_FOR_TOPIC[b] !== toolA ? TOOL_FOR_TOPIC[b]! : TOOLS.find((t) => t !== toolA)!;
  return [
    { key: "guide", kind: "guide", href: "/learn/guide" },
    { key: `lesson:${a}`, kind: "lesson", topic: a, href: `/learn/${a}` },
    { key: `tool:${toolA}`, kind: "tool", tool: toolA, href: `/tools/${toolA}` },
    { key: `lesson:${b}`, kind: "lesson", topic: b, href: `/learn/${b}` },
    { key: `tool:${toolB}`, kind: "tool", tool: toolB, href: `/tools/${toolB}` },
    { key: "game", kind: "game", href: "/play" },
  ];
}
