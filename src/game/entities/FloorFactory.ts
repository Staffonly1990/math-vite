import type { Rng } from '../rng';
import { Floor } from './Floor';
import { Level } from './Level';
import { MonsterFactory } from './monsters/MonsterFactory';

/** Фабрика этажей (локаций) бесконечной башни. */
export class FloorFactory {
  /**
   * Раскладка башни: каждый 5-й этаж — сокровищница, каждый 3-й — бой, остальные — двери.
   * Этаж 1 всегда дверь (мягкий старт).
   */
  static tower(floorNumber: number, rng: Rng): Floor {
    if (floorNumber > 1 && floorNumber % 5 === 0) return FloorFactory.treasure(floorNumber);
    if (floorNumber % 3 === 0) return FloorFactory.combat(floorNumber, rng);
    return FloorFactory.challenge(floorNumber);
  }

  /** Время на ответ: сжимается с высотой и уровнем сложности (тюнинг-константы) */
  private static answerTimeLimit(floorNumber: number): number {
    const level = Level.forFloor(floorNumber).number;
    return Math.max(10_000, 30_000 - (floorNumber - 1) * 1_000 - (level - 1) * 2_000);
  }

  /** Этаж с примерами (двери) — без монстров и без локального таймера */
  static challenge(floorNumber: number): Floor {
    return new Floor(floorNumber, 'challenge');
  }

  /** Боевой этаж: состав монстров по бюджету уровня */
  static combat(floorNumber: number, rng: Rng): Floor {
    const level = Level.forFloor(floorNumber);
    const monsters = MonsterFactory.composeForLevel(level, floorNumber, rng);
    return new Floor(floorNumber, 'combat', monsters, { timeLimitMs: FloorFactory.answerTimeLimit(floorNumber) });
  }

  /** Этаж-сокровищница: сундуки, время продолжает идти */
  static treasure(floorNumber: number): Floor {
    return new Floor(floorNumber, 'treasure', [], { chests: 1 + (floorNumber % 3) });
  }
}
