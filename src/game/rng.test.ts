import { describe, expect, it } from 'vitest';
import { Rng } from './rng';

describe('Rng', () => {
  it('детерминирован: один seed — одна последовательность', () => {
    const a = new Rng(42, 0);
    const b = new Rng(42, 0);
    const seqA = Array.from({ length: 10 }, () => a.int(1, 99));
    const seqB = Array.from({ length: 10 }, () => b.int(1, 99));
    expect(seqA).toEqual(seqB);
  });

  it('разные index дают разные потоки', () => {
    const first = Array.from({ length: 5 }, () => new Rng(42, 0).int(1, 99999));
    const second = Array.from({ length: 5 }, () => new Rng(42, 1).int(1, 99999));
    expect(first).not.toEqual(second);
  });

  it('int в границах включительно', () => {
    const rng = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const value = rng.int(2, 20);
      expect(value).toBeGreaterThanOrEqual(2);
      expect(value).toBeLessThanOrEqual(20);
    }
  });

  it('shuffle сохраняет набор элементов', () => {
    const rng = new Rng(9);
    const source = [1, 2, 3, 4, 5];
    const shuffled = rng.shuffle(source);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(source);
  });
});
