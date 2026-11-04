import type { Rng } from '../rng';
import { Floor } from './Floor';
import { Level } from './Level';
import { MonsterFactory } from './monsters/MonsterFactory';

/** Фабрика этажей (локаций) бесконечной башни. */
export class FloorFactory {
  /** Этаж с примерами (двери) — без монстров */
  static challenge(floorNumber: number): Floor {
    return new Floor(floorNumber, 'challenge');
  }

  /** Боевой этаж: состав монстров по бюджету уровня, таймер сжимается с высотой и уровнем */
  static combat(floorNumber: number, rng: Rng): Floor {
    const level = Level.forFloor(floorNumber);
    const monsters = MonsterFactory.composeForLevel(level, floorNumber, rng);
    const timeLimitMs = Math.max(
      10_000,
      30_000 - (floorNumber - 1) * 1_000 - (level.number - 1) * 2_000,
    );
    return new Floor(floorNumber, 'combat', monsters, { timeLimitMs });
  }

  /** Этаж-сокровищница: сундуки, время продолжает идти */
  static treasure(floorNumber: number): Floor {
    return new Floor(floorNumber, 'treasure', [], { chests: 1 + (floorNumber % 3) });
  }
}
