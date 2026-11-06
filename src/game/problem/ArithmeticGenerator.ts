import type { DifficultyConfig, StageFocus } from '../difficulty';
import type { Rng } from '../rng';
import { ArithmeticProblem } from './ArithmeticProblem';
import type { Expression, Suffix, Term } from './ArithmeticProblem';
import { termValue } from './ArithmeticProblem';
import { ProblemGenerator } from './ProblemGenerator';

/** Переставить цифры: 47 → 74 — правдоподобный «промах по разряду» */
function swapDigits(n: number): number | null {
  if (n < 10 || n >= 100) return null;
  const swapped = (n % 10) * 10 + Math.floor(n / 10);
  return swapped === n ? null : swapped;
}

/**
 * Генератор арифметики «знак × количество чисел»:
 *   пример = слагаемые/вычитаемые (1..9 или 11..99) + максимум один ×-терм
 *   и один ÷-терм (÷ нацело по построению); все промежуточные суммы ≥ 0, ответ ≥ 1.
 */
export class ArithmeticGenerator extends ProblemGenerator {
  readonly topic = 'arithmetic' as const;

  generate(rng: Rng, cfg: DifficultyConfig, optionsCount = 4): ArithmeticProblem {
    for (let attempt = 0; attempt < 200; attempt++) {
      const expr = this.buildExpression(rng, cfg);
      if (expr && this.isValid(expr)) return this.finish(rng, expr, optionsCount);
    }
    // недостижимо практически (валидных комбинаций много), но выход должен быть гарантирован:
    // чистое сложение из cfg.numbers маленьких слагаемых — всегда валидно
    const expr: Expression = {
      first: { kind: 'num', value: rng.int(1, 9) },
      rest: Array.from({ length: cfg.numbers - 1 }, () => ({
        op: '+' as const,
        term: { kind: 'num' as const, value: rng.int(1, 9) },
      })),
    };
    return this.finish(rng, expr, optionsCount);
  }

  /** Какие специальные термы (×/÷) нужны этапу */
  private specialPlan(rng: Rng, focus: StageFocus, numbers: number): Array<'mul' | 'div'> {
    switch (focus) {
      case '+':
      case '-':
      case 'big':
        return [];
      case '*':
        return ['mul'];
      case '/':
        // последний ÷-этап (4 числа): половина примеров — с ×-термом, микс
        return numbers === 4 && rng.next() < 0.5 ? ['mul', 'div'] : ['div'];
      case 'all': {
        const roll = rng.next();
        if (roll < 1 / 3) return [];
        if (roll < 2 / 3) return [rng.next() < 0.5 ? 'mul' : 'div'];
        return ['mul', 'div'];
      }
    }
  }

  /** ×-терм — из таблицы; ÷-терм — делимое собрано из делителя и частного, нацело гарантировано */
  private specialTerm(rng: Rng, kind: 'mul' | 'div', factorMax: number): Term {
    if (kind === 'mul') return { kind: 'mul', a: rng.int(2, factorMax), b: rng.int(2, factorMax) };
    const divisor = rng.int(2, factorMax);
    const quotient = rng.int(2, factorMax);
    return { kind: 'div', a: divisor * quotient, b: divisor };
  }

  /** Знаки между термами: '+' — все плюсы; '-' — минимум один минус; остальные — смесь */
  private joiners(rng: Rng, focus: StageFocus, count: number): Array<'+' | '-'> {
    if (count <= 0) return [];
    if (focus === '+') return Array.from({ length: count }, () => '+' as const);
    const ops = Array.from({ length: count }, () => (rng.next() < 0.5 ? '+' : '-') as '+' | '-');
    if (focus === '-' && !ops.includes('-')) ops[rng.int(0, count - 1)] = '-';
    return ops;
  }

  private buildExpression(rng: Rng, cfg: DifficultyConfig): Expression | null {
    const specials = this.specialPlan(rng, cfg.focus, cfg.numbers);
    const plainCount = cfg.numbers - specials.length * 2;
    if (plainCount < 0) return null; // терм не влезает в число мест — пересобираем

    // двузначный ярус и финальный микс — операнды 11..99, остальные этапы 1..9
    const big = cfg.focus === 'big' || cfg.focus === 'all';

    const terms: Term[] = specials.map((kind) => this.specialTerm(rng, kind, cfg.factorMax));
    for (let i = 0; i < plainCount; i++) {
      terms.push({ kind: 'num', value: rng.int(big ? 11 : 1, cfg.addMax) });
    }

    const shuffled = rng.shuffle(terms);
    const ops = this.joiners(rng, cfg.focus, shuffled.length - 1);
    const rest: Suffix[] = shuffled.slice(1).map((term, i) => ({ op: ops[i], term }));
    return { first: shuffled[0], rest };
  }

  /** Инварианты: все промежуточные суммы ≥ 0 и ответ ≥ 1 (без тривиальных нулей) */
  private isValid(expr: Expression): boolean {
    let sum = termValue(expr.first);
    for (const s of expr.rest) {
      sum += s.op === '+' ? termValue(s.term) : -termValue(s.term);
      if (sum < 0) return false;
    }
    return sum >= 1;
  }

  private finish(rng: Rng, expr: Expression, optionsCount: number): ArithmeticProblem {
    const answer = ArithmeticProblem.evaluate(expr.first, expr.rest);
    const distractors = this.buildDistractors(rng, answer, optionsCount - 1);
    const options = rng.shuffle([answer, ...distractors]);
    return new ArithmeticProblem(expr.first, expr.rest, distractors, options);
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
