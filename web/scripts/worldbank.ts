/**
 * Snapshots World Bank open-data indicators for every region pack into
 * src/content/worldbank.json. No API key needed.
 *
 *   npm run worldbank
 *
 * The snapshot is committed so the app works offline. World Bank figures lag the central-bank
 * figures in the packs by a year or more, so the guide shows both with their dates.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { REGIONS } from "../src/lib/regions";
import { INDICATORS, worldBankSnapshotSchema, type WorldBankSnapshot } from "../src/lib/worldbank/schema";

const out = path.resolve(import.meta.dirname, "../src/content/worldbank.json");

interface Row {
  countryiso3code: string;
  date: string;
  value: number | null;
}

async function fetchIndicator(codes: string[], id: string): Promise<Row[]> {
  const url = `https://api.worldbank.org/v2/country/${codes.join(";")}/indicator/${id}?format=json&mrnev=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  const [, rows] = (await res.json()) as [unknown, Row[] | null];
  return rows ?? [];
}

async function main() {
  const regions = Object.values(REGIONS);
  const snapshot: WorldBankSnapshot = { fetched: new Date().toISOString().slice(0, 10), countries: {} };
  for (const [key, id] of Object.entries(INDICATORS)) {
    for (const row of await fetchIndicator(regions.map((r) => r.economy.worldBankCode), id)) {
      const region = regions.find((r) => r.economy.worldBankCode === row.countryiso3code);
      if (!region || row.value === null) continue;
      snapshot.countries[region.id] ??= {};
      snapshot.countries[region.id][key as keyof typeof INDICATORS] = {
        value: Math.round(row.value * 10) / 10,
        year: Number(row.date),
        source: `https://data.worldbank.org/indicator/${id}?locations=${region.id}`,
      };
    }
  }
  writeFileSync(out, JSON.stringify(worldBankSnapshotSchema.parse(snapshot), null, 2) + "\n");
  console.log(`Wrote ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
