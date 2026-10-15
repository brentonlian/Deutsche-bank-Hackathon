/** Deterministic PRNG so a replayed game sees exactly the same life events. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Each stage gets its own stream derived from (game seed, stage index), so changing an
 * earlier choice never shifts the random events of later stages. This is what makes
 * what-if comparisons fair.
 */
export function stageRng(seed: number, stageIndex: number): () => number {
  return mulberry32(Math.imul(seed ^ 0x9e3779b9, 31) + stageIndex * 0x85ebca6b);
}
