import type { Operation } from '../difficulty';
import { Problem } from './Problem';
import type { ProblemJSON } from './Problem';

const SYMBOLS: Record<Operation, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' };

export interface ArithmeticProblemJSON extends ProblemJSON {
  kind: 'arithmetic';
  a: number;
  op: Operation;
  b: number;
  distractors: number[];
  options: number[];
}

/** Арифметика двух чисел: + − × ÷. Ответ вычисляется самим классом. */
export class ArithmeticProblem extends Problem {
  readonly kind = 'arithmetic';
  readonly prompt: string;
  readonly answer: number;

  constructor(
    readonly a: number,
    readonly op: Operation,
    readonly b: number,
    readonly distractors: readonly number[] = [],
    readonly options: readonly number[] = [],
  ) {
    super();
    this.prompt = `${a} ${SYMBOLS[op]} ${b}`;
    this.answer = ArithmeticProblem.compute(a, op, b);
  }

  /** Вычисление ответа живёт в самом классе задачи */
  static compute(a: number, op: Operation, b: number): number {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return a / b;
    }
  }

  toJSON(): ArithmeticProblemJSON {
    return {
      kind: this.kind,
      a: this.a,
      op: this.op,
      b: this.b,
      distractors: [...this.distractors],
      options: [...this.options],
    };
  }

  static fromJSON(data: ArithmeticProblemJSON): ArithmeticProblem {
    return new ArithmeticProblem(data.a, data.op, data.b, data.distractors, data.options);
  }
}
