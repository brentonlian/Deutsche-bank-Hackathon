import DE from "@/content/regions/DE.json";
import IN from "@/content/regions/IN.json";
import MX from "@/content/regions/MX.json";
import US from "@/content/regions/US.json";
import { regionPackSchema, type RegionPack } from "./schema";

// Adding a country = add a JSON file and list it here. Schema validation runs at load and in CI.
const raw = { US, IN, DE, MX } as const;

export type RegionId = keyof typeof raw;

export const REGIONS: Record<RegionId, RegionPack> = Object.fromEntries(
  Object.entries(raw).map(([id, pack]) => [id, regionPackSchema.parse(pack)]),
) as Record<RegionId, RegionPack>;

export const REGION_IDS = Object.keys(REGIONS) as RegionId[];

export function getRegion(id: string): RegionPack {
  const region = REGIONS[id as RegionId];
  if (!region) throw new Error(`Unknown region: ${id}`);
  return region;
}

export function isRegionId(id: string): id is RegionId {
  return id in REGIONS;
}
