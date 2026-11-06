import type { CarryRule, DifficultyConfig, Operation } from '../difficulty';
import type { Rng } from '../rng';
import { ArithmeticProblem } from './ArithmeticProblem';
import { ProblemGenerator } from './ProblemGenerator';

const ones = (n: number) => n % 10;
const additionCarries = (a: number, b: number) => ones(a) + ones(b) >= 10;
const subtractionBorrows = (a: number, b: number) => ones(a) < ones(b);

/** Переставить цифры: 47 → 74 — правдоподобный «промах по разряду» */
function swapDigits(n: number): number | null {
  if (n < 10 || n >= 100) return null;
  const swapped = ones(n) * 10 + Math.floor(n / 10);
  return swapped === n ? null : swapped;
}

/**
 * Генератор арифметики: + − × ÷ по правилам сложности.
 * Деление — всегда без остатка (собирается из делителя и частного).
 */
export class ArithmeticGenerator extends ProblemGenerator {
  readonly topic = 'arithmetic' as const;

  generate(rng: Rng, cfg: DifficultyConfig, optionsCount = 4): ArithmeticProblem {
    for (let attempt = 0; attempt < 200; attempt++) {
      const op = rng.pick(cfg.operations);
      // на поздних попытках ослабляем требование переноса, чтобы гарантированно не зациклиться
      const rule: CarryRule = attempt < 100 ? cfg.carry : 'any';

      if (op === '+' || op === '-') {
        let a = rng.int(cfg.min, cfg.max);
        let b = rng.int(cfg.min, cfg.max);
        if (op === '-' && a < b) [a, b] = [b, a]; // ответ всегда неотрицательный
        if (op === '-' && a === b) continue; // a − a = 0 — тривиально
        const carries = op === '+' ? additionCarries(a, b) : subtractionBorrows(a, b);
        if (rule === 'require' && !carries) continue;
        if (rule === 'forbid' && carries) continue;
        return this.finish(rng, a, op, b, optionsCount);
      }

      if (op === '*') {
        // устный формат: большое число × однозначный множитель
        return this.finish(rng, rng.int(cfg.min, cfg.max), op, rng.int(2, 9), optionsCount);
      }

      // '/': делимое собираем из делителя и частного — деление нацело гарантировано
      const divisor = rng.int(2, 9);
      const maxQuotient = Math.max(2, Math.min(12, Math.floor((cfg.max * 3) / divisor)));
      const quotient = rng.int(2, maxQuotient);
      return this.finish(rng, divisor * quotient, op, divisor, optionsCount);
    }

    // недостижимо практически (валидных комбинаций много), но выход должен быть гарантирован
    return this.finish(rng, rng.int(cfg.min, cfg.max), '+', rng.int(cfg.min, cfg.max), optionsCount);
  }

  private finish(rng: Rng, a: number, op: Operation, b: number, optionsCount: number): ArithmeticProblem {
    const answer = ArithmeticProblem.compute(a, op, b);
    const distractors = this.buildDistractors(rng, answer, optionsCount - 1);
    const options = rng.shuffle([answer, ...distractors]);
    return new ArithmeticProblem(a, op, b, distractors, options);
  }

  /** Правдоподобные неверные варианты: ±1/±2/±10/±11/±9, ±100 для трёхзначных, перепутанные цифры */
  private buildDistractors(rng: Rng, answer: number, count: number): number[] {
    const pool: number[] = [];
    const push = (n: number) => {
      if (n >= 0 && n !== answer && !pool.includes(n)) pool.push(n);
    };

    const deltas = answer >= 100
      ? [1, -1, 2, -2, 10, -10, 100, -100, 11, -11, 9, -9]
      : [1, -1, 2, -2, 10, -10, 11, -11, 9, -9, 20, -20];
    for (const delta of deltas) push(answer + delta);
    const swapped = swapDigits(answer);
    if (swapped !== null) push(swapped);

    // добор на случай маленького пула
    for (let k = 3; pool.length < count && k < 30; k++) {
      push(answer + k);
      push(answer - k);
    }

    return rng.shuffle(pool).slice(0, Math.max(0, count));
  }
}
