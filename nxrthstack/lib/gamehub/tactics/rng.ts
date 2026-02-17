// ============================================================================
// Seeded PRNG - Mulberry32
// Deterministic: same seed always produces the same sequence
// ============================================================================

export interface SeededRng {
  /** Returns a float in [0, 1) */
  next(): number;
  /** Returns an integer in [min, max] inclusive */
  nextInt(min: number, max: number): number;
  /** Returns a float in [0, 1) - alias for next() */
  nextFloat(): number;
  /** Returns true with the given probability (0-1) */
  chance(probability: number): boolean;
  /** Shuffles an array in place and returns it */
  shuffle<T>(array: T[]): T[];
}

export function createRng(seed: number): SeededRng {
  let state = seed | 0;

  function mulberry32(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next: mulberry32,
    nextFloat: mulberry32,

    nextInt(min: number, max: number): number {
      return min + Math.floor(mulberry32() * (max - min + 1));
    },

    chance(probability: number): boolean {
      return mulberry32() < probability;
    },

    shuffle<T>(array: T[]): T[] {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(mulberry32() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },
  };
}
