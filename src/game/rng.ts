/**
 * Детерминированный PRNG (mulberry32).
 *
 * Пересоздаётся из (seed, index): одинаковый seed даёт одинаковую последовательность задач,
 * поэтому rng не хранится в стейте сессии — стейт остаётся сериализуемым,
 * а генерация воспроизводимой (задел на мультиплеер и реплеи).
 */
export class Rng {
  private state: number;

  constructor(seed: number, index = 0) {
    const mixed = (seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
    this.state = mixed === 0 ? 0x6d2b79f5 : mixed;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Целое в [min, max] включительно */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)] as T;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      const tmp = copy[i] as T;
      copy[i] = copy[j] as T;
      copy[j] = tmp;
    }
    return copy;
  }
}
