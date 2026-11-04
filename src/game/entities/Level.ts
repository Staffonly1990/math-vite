import type { MonsterRank } from './monsters/Monster';

/** Сколько этажей нужно пройти для перехода на следующий уровень сложности */
export const FLOORS_PER_LEVEL = 3;

export interface LevelJSON {
  number: number;
}

/**
 * Уровень сложности (не путать с этажом-локацией Floor).
 * Переключается, когда игрок преодолел всё необходимое: каждые FLOORS_PER_LEVEL этажей.
 */
export class Level {
  constructor(readonly number: number) {}

  static first(): Level {
    return new Level(1);
  }

  /** Уровень сложности по этажу бесконечной башни */
  static forFloor(floorNumber: number): Level {
    return new Level(1 + Math.floor((floorNumber - 1) / FLOORS_PER_LEVEL));
  }

  /** Вычисляемое число этажа: суммарный ранг монстров, которые на нём появятся */
  get monsterBudget(): number {
    return this.number + 1;
  }

  /** Ранги монстров, доступные на этом уровне: ранг R открывается на уровне R */
  get maxRank(): MonsterRank {
    // 2 — максимум среди существующих классов; вырастет с новыми монстрами
    return Math.min(2, this.number) as MonsterRank;
  }

  next(): Level {
    return new Level(this.number + 1);
  }

  toJSON(): LevelJSON {
    return { number: this.number };
  }

  static fromJSON(data: LevelJSON): Level {
    return new Level(data.number);
  }
}
