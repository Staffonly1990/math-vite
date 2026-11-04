export type Operation = '+' | '-' | '*' | '/';

/** «Переход через разряд» — часть сложности, поэтому он настраивается декларативно */
export type CarryRule = 'forbid' | 'require' | 'any';

export interface DifficultyConfig {
  /** Диапазон операндов, включительно */
  min: number;
  max: number;
  operations: readonly Operation[];
  carry: CarryRule;
}

/**
 * Лестница математики по уровню сложности (не по этажу!):
 *   ур.1 — '+';  ур.2 — '+ −';  ур.3 — '+ − ×';  ур.4+ — '+ − × ÷' (÷ нацело).
 * Диапазоны растут с уровнем; на ур.1 перенос через десяток запрещён, дальше —.required.
 * (Третье число и микс знаков — ур.5/6+, добавим следующей итерацией генератора.)
 */
export function configForLevel(levelNumber: number): DifficultyConfig {
  const level = Math.max(1, Math.floor(levelNumber));

  const ladder: readonly Operation[][] = [['+'], ['+', '-'], ['+', '-', '*'], ['+', '-', '*', '/']];
  const operations = ladder[Math.min(level, 4) - 1];

  const min = level === 1 ? 2 : level <= 3 ? 11 : 21;
  const max = level === 1 ? 20 : level === 2 ? 99 : level === 3 ? 99 : Math.min(199 + (level - 4) * 100, 999);
  const carry: CarryRule = level === 1 ? 'forbid' : 'require';

  return { min, max, operations, carry };
}
