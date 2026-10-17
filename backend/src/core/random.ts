/**
 * Gerador pseudoaleatório determinístico e sem dependências de plataforma:
 * a mesma entrada sempre gera o mesmo resultado simulado, no Node e no app.
 */
export type Rand = () => number;

/** Hash FNV-1a de 32 bits. */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function seededRandom(seed: string): Rand {
  let state = hash(seed) || 1;
  return () => {
    // xorshift32
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

export const pick = <T>(rand: Rand, items: readonly T[]): T => items[Math.floor(rand() * items.length)] as T;

export const pickMany = <T>(rand: Rand, items: readonly T[], count: number): T[] =>
  items
    .map((item) => ({ item, key: rand() }))
    .sort((a, b) => a.key - b.key)
    .slice(0, Math.min(count, items.length))
    .map(({ item }) => item);

export const randomDate = (rand: Rand, fromYear: number, toYear: number): string => {
  const year = fromYear + Math.floor(rand() * (toYear - fromYear + 1));
  const month = 1 + Math.floor(rand() * 12);
  const day = 1 + Math.floor(rand() * 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};
