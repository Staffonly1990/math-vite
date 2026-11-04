export type DifficultyId = 'easy' | 'medium' | 'hard';

/** Операции арифметики; × и ÷ уже поддержаны генератором — включаются строкой в конфиге */
export type Operation = '+' | '-' | '*' | '/';

/** «Переход через разряд» — часть сложности, поэтому он настраивается декларативно */
export type CarryRule = 'forbid' | 'require' | 'any';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  /** Диапазон операндов, включительно */
  min: number;
  max: number;
  operations: readonly Operation[];
  carry: CarryRule;
  hint: string;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Лёгкая',
    min: 2,
    max: 20,
    operations: ['+', '-'],
    carry: 'forbid',
    hint: 'числа 2–20. разомнись, герой',
  },
  medium: {
    id: 'medium',
    label: 'Средняя',
    min: 11,
    max: 99,
    operations: ['+', '-'],
    carry: 'require',
    hint: '11–99, переход через разряд. уже думать надо',
  },
  hard: {
    id: 'hard',
    label: 'Сложная',
    min: 21,
    max: 199,
    operations: ['+', '-'],
    carry: 'any',
    hint: 'до трёхзначных. таблицу сложения ещё помнишь?',
  },
};

export function getDifficulty(id: DifficultyId): DifficultyConfig {
  return DIFFICULTIES[id];
}
