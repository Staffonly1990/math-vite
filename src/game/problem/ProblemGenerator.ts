import type { Rng } from '../rng';
import type { DifficultyConfig, DifficultyId } from '../difficulty';
import type { Problem } from './Problem';

/**
 * Открытый union тем: новая тема (умножение/деление уже внутри арифметики; дальше —
 * дроби, производные, тригонометрия…) добавляется сюда + одной записью в реестр
 * ProblemFactory — компилятор укажет, если забудешь регистратор.
 */
export type TopicId = 'arithmetic';

/** Что генерировать: тема + сложность (тир внутри темы) */
export interface ProblemSpec {
  topic: TopicId;
  difficulty: DifficultyId;
}

/** Стратегия генерации задач темы. Вся специфика темы — внутри её генератора. */
export abstract class ProblemGenerator {
  abstract readonly topic: TopicId;
  abstract generate(rng: Rng, cfg: DifficultyConfig): Problem;
}
