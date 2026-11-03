// Seeded, serializable RNG (mulberry32). The whole generator is two integers, so it lives inside the game state.
export interface Rng {
  seed: number;
  state: number;
}

export function createRng(seed: number): Rng {
  const normalized = seed >>> 0;
  return { seed: normalized, state: normalized };
}

export function randomSeed(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0];
}

// Returns a float in [0, 1).
export function nextFloat(rng: Rng): number {
  rng.state = (rng.state + 0x6d2b79f5) >>> 0;
  let t = rng.state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Returns an integer in [0, max).
export function nextInt(rng: Rng, max: number): number {
  return Math.floor(nextFloat(rng) * max);
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = nextInt(rng, index + 1);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function rollDie(rng: Rng, sides = 6): number {
  return nextInt(rng, sides) + 1;
}
