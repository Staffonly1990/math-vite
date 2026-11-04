/**
 * Задача — сущность со своей сложностью и поведением.
 * Все методы вычисления конкретного вида задачи лежат в его классе.
 */
export interface ProblemJSON {
  /** дискриминатор вида: по нему ProblemFactory восстанавливает класс */
  kind: string;
}

export abstract class Problem {
  abstract readonly kind: string;
  abstract readonly prompt: string;
  abstract readonly answer: number;
  /** 4 перемешанных варианта; всегда содержит ответ */
  abstract readonly options: readonly number[];
  /** 3 правдоподобных неверных варианта */
  abstract readonly distractors: readonly number[];

  isCorrect(input: number): boolean {
    return input === this.answer;
  }

  abstract toJSON(): ProblemJSON;
}
