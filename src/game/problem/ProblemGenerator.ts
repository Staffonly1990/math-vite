import type { Rng } from '../rng';
import type { DifficultyConfig } from '../difficulty';
import type { Problem } from './Problem';

/**
 * Открытый union тем: новая тема (дроби, производные, тригонометрия…) добавляется
 * сюда + одной записью в реестр ProblemFactory — компилятор укажет, если забудешь регистратор.
 */
export type TopicId = 'arithmetic';

/** Что генерировать: тема + уровень сложности (лестница математики) */
export interface ProblemSpec {
  topic: TopicId;
  level: number;
}

/** Стратегия генерации задач темы. Вся специфика темы — внутри её генератора. */
export abstract class ProblemGenerator {
  abstract readonly topic: TopicId;
  abstract generate(rng: Rng, cfg: DifficultyConfig): Problem;
}
