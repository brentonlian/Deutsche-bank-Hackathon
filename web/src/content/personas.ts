import type { AgeGroup } from "@/lib/game/types";
import type { Lang } from "@/lib/i18n";
import type { Topic } from "@/lib/lessons";
import type { RegionId } from "@/lib/regions";

/**
 * Demo personas: one per age group, each in a different country and setup. A fixed seed means
 * the same life events every time, so the demo can be rehearsed. Names and stories are fictional.
 */
export interface Persona {
  id: string;
  regionId: RegionId;
  city: string;
  lang: Lang;
  group: AgeGroup;
  age: number;
  /** Monthly take-home income (pension for the senior) in local currency. */
  income: number;
  free: number;
  seed: number;
  topics: [Topic, Topic];
}

export const PERSONAS: Persona[] = [
  {
    id: "maya",
    regionId: "US",
    city: "New York",
    lang: "en",
    group: "young",
    age: 24,
    income: 3200,
    free: 450,
    seed: 2024,
    topics: ["credit-and-debt", "saving-vs-investing"],
  },
  {
    id: "ananya",
    regionId: "IN",
    city: "Bengaluru",
    lang: "en",
    group: "middle",
    age: 42,
    income: 95000,
    free: 15000,
    seed: 4242,
    topics: ["budgeting", "scams-and-fraud"],
  },
  {
    id: "brigitte",
    regionId: "DE",
    city: "Köln",
    lang: "de",
    group: "senior",
    age: 68,
    income: 1650,
    free: 200,
    seed: 6868,
    topics: ["retirement", "scams-and-fraud"],
  },
];

export const getPersona = (id: string | undefined) => PERSONAS.find((p) => p.id === id);
