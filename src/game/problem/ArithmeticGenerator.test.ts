import { describe, expect, it } from 'vitest';
import { Rng } from '../rng';
import { DIFFICULTIES } from '../difficulty';
import type { DifficultyConfig } from '../difficulty';
import { ProblemFactory } from './ProblemFactory';
import { ArithmeticGenerator } from './ArithmeticGenerator';
import { ArithmeticProblem } from './ArithmeticProblem';

const ones = (n: number) => n % 10;

describe.each(Object.values(DIFFICULTIES))('генератор арифметики: $id', (cfg: DifficultyConfig) => {
  it('генерирует валидные задачи через фабрику', () => {
    for (let index = 0; index < 1000; index++) {
      const problem = ProblemFactory.create(new Rng(1234, index), { topic: 'arithmetic', difficulty: cfg.id });
      expect(problem).toBeInstanceOf(ArithmeticProblem);
      const arithmetic = problem as ArithmeticProblem;

      // ответ совпадает с операцией (вычисление — в самом классе)
      expect(arithmetic.answer).toBe(ArithmeticProblem.compute(arithmetic.a, arithmetic.op, arithmetic.b));
      // операнды в диапазоне сложности
      expect(arithmetic.a).toBeGreaterThanOrEqual(cfg.min);
      expect(arithmetic.b).toBeGreaterThanOrEqual(cfg.min);
      expect(arithmetic.a).toBeLessThanOrEqual(cfg.max);
      expect(arithmetic.b).toBeLessThanOrEqual(cfg.max);
      // ответ положительный и не вырожденный
      expect(arithmetic.answer).toBeGreaterThanOrEqual(1);
      if (arithmetic.op === '-') {
        expect(arithmetic.a).toBeGreaterThan(arithmetic.b);
      }
      // варианты: 4 уникальных, содержат ответ, все неотрицательные
      expect(arithmetic.options).toHaveLength(4);
      expect(new Set(arithmetic.options).size).toBe(4);
      expect(arithmetic.options).toContain(arithmetic.answer);
      expect(arithmetic.options.every((option) => option >= 0)).toBe(true);
    }
  });

  it('соблюдает правило переноса через разряд', () => {
    for (let index = 0; index < 300; index++) {
      const problem = ProblemFactory.create(new Rng(99, index), { topic: 'arithmetic', difficulty: cfg.id }) as ArithmeticProblem;
      const carries = problem.op === '+' ? ones(problem.a) + ones(problem.b) >= 10 : ones(problem.a) < ones(problem.b);
      if (cfg.carry === 'forbid') expect(carries).toBe(false);
      if (cfg.carry === 'require') expect(carries).toBe(true);
    }
  });

  it('детерминирован по (seed, index)', () => {
    const first = ProblemFactory.create(new Rng(555, 3), { topic: 'arithmetic', difficulty: cfg.id });
    const second = ProblemFactory.create(new Rng(555, 3), { topic: 'arithmetic', difficulty: cfg.id });
    expect(second).toEqual(first);
  });
});

describe('генератор арифметики: × и ÷ (кастомный конфиг)', () => {
  const cfg: DifficultyConfig = { ...DIFFICULTIES.easy, operations: ['*', '/'] };

  it('умножение и деление валидны и нацело делимы', () => {
    const generator = new ArithmeticGenerator();
    for (let i = 0; i < 300; i++) {
      const problem = generator.generate(new Rng(77, i), cfg);
      expect(['*', '/']).toContain(problem.op);

      if (problem.op === '*') {
        expect(problem.b).toBeGreaterThanOrEqual(2);
        expect(problem.b).toBeLessThanOrEqual(9);
        expect(problem.answer).toBe(problem.a * problem.b);
      } else {
        expect(problem.b).toBeGreaterThanOrEqual(2);
        expect(problem.b).toBeLessThanOrEqual(9);
        expect(problem.a % problem.b).toBe(0); // деление нацело
        expect(problem.answer).toBe(problem.a / problem.b);
      }
      expect(problem.answer).toBeGreaterThanOrEqual(2);
    }
  });
});
