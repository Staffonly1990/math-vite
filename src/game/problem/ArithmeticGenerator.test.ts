import { describe, expect, it } from 'vitest';
import { Rng } from '../rng';
import { configForLevel } from '../difficulty';
import { ProblemFactory } from './ProblemFactory';
import { ArithmeticGenerator } from './ArithmeticGenerator';
import { ArithmeticProblem } from './ArithmeticProblem';

const ones = (n: number) => n % 10;

describe('лестница математики по уровням', () => {
  it('операции открываются по уровню', () => {
    expect(configForLevel(1).operations).toEqual(['+']);
    expect(configForLevel(2).operations).toEqual(['+', '-']);
    expect(configForLevel(3).operations).toEqual(['+', '-', '*']);
    expect(configForLevel(4).operations).toEqual(['+', '-', '*', '/']);
    expect(configForLevel(9).operations).toEqual(['+', '-', '*', '/']); // дальше не растёт
  });

  it('диапазоны растут, на ур.1 перенос запрещён', () => {
    expect(configForLevel(1)).toMatchObject({ min: 2, max: 20, carry: 'forbid' });
    expect(configForLevel(2)).toMatchObject({ min: 11, max: 99, carry: 'require' });
    expect(configForLevel(5).max).toBeGreaterThan(configForLevel(4).max);
  });
});

describe.each([1, 2, 3, 4, 6])('генератор арифметики: уровень %i', (level: number) => {
  it('генерирует валидные задачи через фабрику', () => {
    const cfg = configForLevel(level);
    for (let index = 0; index < 500; index++) {
      const problem = ProblemFactory.create(new Rng(1234, index), { topic: 'arithmetic', level });
      expect(problem).toBeInstanceOf(ArithmeticProblem);
      const p = problem as ArithmeticProblem;

      expect(cfg.operations).toContain(p.op);
      expect(p.answer).toBe(ArithmeticProblem.compute(p.a, p.op, p.b));
      expect(p.answer).toBeGreaterThanOrEqual(1);
      if (p.op === '+') {
        expect(p.a).toBeGreaterThanOrEqual(cfg.min);
        expect(p.b).toBeGreaterThanOrEqual(cfg.min);
        expect(p.a).toBeLessThanOrEqual(cfg.max);
        expect(p.b).toBeLessThanOrEqual(cfg.max);
      }
      if (p.op === '-') expect(p.a).toBeGreaterThan(p.b);
      if (p.op === '/') {
        expect(p.b).toBeGreaterThanOrEqual(2);
        expect(p.b).toBeLessThanOrEqual(9);
        expect(p.a % p.b).toBe(0); // деление только нацело
      }
      if (p.op === '*') {
        expect(p.b).toBeGreaterThanOrEqual(2);
        expect(p.b).toBeLessThanOrEqual(9);
      }
      expect(p.options).toHaveLength(4);
      expect(new Set(p.options).size).toBe(4);
      expect(p.options).toContain(p.answer);
      expect(p.options.every((o) => o >= 0)).toBe(true);
    }
  });

  it('правило переноса соблюдается для + и −', () => {
    const cfg = configForLevel(level);
    for (let index = 0; index < 200; index++) {
      const p = ProblemFactory.create(new Rng(99, index), { topic: 'arithmetic', level }) as ArithmeticProblem;
      if (p.op !== '+' && p.op !== '-') continue;
      const carries = p.op === '+' ? ones(p.a) + ones(p.b) >= 10 : ones(p.a) < ones(p.b);
      if (cfg.carry === 'forbid') expect(carries).toBe(false);
      if (cfg.carry === 'require') expect(carries).toBe(true);
    }
  });

  it('детерминирован по (seed, index)', () => {
    const first = ProblemFactory.create(new Rng(555, 3), { topic: 'arithmetic', level });
    const second = ProblemFactory.create(new Rng(555, 3), { topic: 'arithmetic', level });
    expect(second).toEqual(first);
  });
});

describe('генератор арифметики: только × и ÷', () => {
  it('валиден и делим нацело', () => {
    const generator = new ArithmeticGenerator();
    const cfg = { ...configForLevel(3), operations: ['*', '/'] as const };
    for (let i = 0; i < 300; i++) {
      const p = generator.generate(new Rng(77, i), cfg);
      expect(['*', '/']).toContain(p.op);
      if (p.op === '*') expect(p.answer).toBe(p.a * p.b);
      else {
        expect(p.a % p.b).toBe(0);
        expect(p.answer).toBe(p.a / p.b);
      }
      expect(p.answer).toBeGreaterThanOrEqual(2);
    }
  });
});
