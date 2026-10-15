import snapshot from "@/content/worldbank.json";
import { worldBankSnapshotSchema, type WorldBankObservation } from "./schema";

const WORLD_BANK = worldBankSnapshotSchema.parse(snapshot);

/** Latest World Bank figures for a region, from the committed snapshot (`npm run worldbank`). */
export function worldBankFor(regionId: string): { inflation?: WorldBankObservation; accountOwnership?: WorldBankObservation } {
  return WORLD_BANK.countries[regionId] ?? {};
}
