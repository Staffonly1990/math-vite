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
  /** Перемешанные варианты (2–4); всегда содержит ответ */
  abstract readonly options: readonly number[];
  /** Правдоподобные неверные варианты */
  abstract readonly distractors: readonly number[];

  isCorrect(input: number): boolean {
    return input === this.answer;
  }

  abstract toJSON(): ProblemJSON;
}
