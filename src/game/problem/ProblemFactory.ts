import { configForLevel } from '../difficulty';
import type { Rng } from '../rng';
import { ArithmeticGenerator } from './ArithmeticGenerator';
import { ArithmeticProblem } from './ArithmeticProblem';
import type { ArithmeticProblemJSON } from './ArithmeticProblem';
import { Problem } from './Problem';
import type { ProblemJSON } from './Problem';
import type { ProblemGenerator, ProblemSpec, TopicId } from './ProblemGenerator';

/**
 * Реестр тем: тип `Record<TopicId, ProblemGenerator>` заставляет компилятор
 * ругаться, если новая тема не зарегистрирована (и наоборот — лишняя не появится).
 */
const generators: { readonly [T in TopicId]: ProblemGenerator } = {
  arithmetic: new ArithmeticGenerator(),
};

export class ProblemFactory {
  static create(rng: Rng, spec: ProblemSpec): Problem {
    return generators[spec.topic].generate(rng, configForLevel(spec.level), spec.optionsCount ?? 4);
  }

  static fromJSON(data: ProblemJSON): Problem {
    switch (data.kind) {
      case 'arithmetic':
        return ArithmeticProblem.fromJSON(data as unknown as ArithmeticProblemJSON);
      default:
        throw new Error(`Неизвестный вид задачи: ${String(data.kind)}`);
    }
  }
}
