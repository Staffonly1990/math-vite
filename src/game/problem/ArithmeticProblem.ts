import { Problem } from './Problem';
import type { ProblemJSON } from './Problem';

/** Терм: число или короткое произведение/частное — ×/÷ живут только внутри терма */
export type Term =
  | { kind: 'num'; value: number }
  | { kind: 'mul'; a: number; b: number }
  | { kind: 'div'; a: number; b: number };

/** Член выражения после первого: знак и терм */
export interface Suffix {
  op: '+' | '-';
  term: Term;
}

/** Выражение = терм, затем знаки ± и термы; приоритет ×/÷ встроен в структуру */
export interface Expression {
  first: Term;
  rest: readonly Suffix[];
}

export interface ArithmeticProblemJSON extends ProblemJSON {
  kind: 'arithmetic';
  first: Term;
  rest: Suffix[];
  distractors: number[];
  options: number[];
}

/** Значение терма (÷ здесь всегда нацело — так строит генератор) */
export function termValue(term: Term): number {
  switch (term.kind) {
    case 'num': return term.value;
    case 'mul': return term.a * term.b;
    case 'div': return term.a / term.b;
  }
}

/** Сколько чисел занимает терм (обычное — 1, ×/÷ — 2) */
export function termNumbers(term: Term): number {
  return term.kind === 'num' ? 1 : 2;
}

const termText = (term: Term): string =>
  term.kind === 'num' ? `${term.value}` : term.kind === 'mul' ? `${term.a} × ${term.b}` : `${term.a} ÷ ${term.b}`;

/** Арифметика: выражение из термов + − × ÷. Ответ вычисляется самим классом. */
export class ArithmeticProblem extends Problem {
  readonly kind = 'arithmetic';
  readonly prompt: string;
  readonly answer: number;
  /** Сколько всего чисел в примере (2–4) */
  readonly numbers: number;

  constructor(
    readonly first: Term,
    readonly rest: readonly Suffix[] = [],
    readonly distractors: readonly number[] = [],
    readonly options: readonly number[] = [],
  ) {
    super();
    const parts = [termText(first)];
    for (const s of rest) parts.push(`${s.op === '+' ? '+' : '−'} ${termText(s.term)}`);
    this.prompt = parts.join(' ');
    this.answer = ArithmeticProblem.evaluate(first, rest);
    this.numbers = termNumbers(first) + rest.reduce((sum, s) => sum + termNumbers(s.term), 0);
  }

  /** Вычисление слева-направо по термам (каждый терм уже посчитан с приоритетом ×/÷) */
  static evaluate(first: Term, rest: readonly Suffix[]): number {
    let sum = termValue(first);
    for (const s of rest) sum += s.op === '+' ? termValue(s.term) : -termValue(s.term);
    return sum;
  }

  toJSON(): ArithmeticProblemJSON {
    return {
      kind: this.kind,
      first: this.first,
      rest: this.rest.map((s) => ({ ...s })),
      distractors: [...this.distractors],
      options: [...this.options],
    };
  }

  static fromJSON(data: ArithmeticProblemJSON): ArithmeticProblem {
    return new ArithmeticProblem(data.first, data.rest, data.distractors, data.options);
  }
}
