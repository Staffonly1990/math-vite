import { Level } from './Level';
import type { LevelJSON } from './Level';
import { Monster } from './monsters/Monster';
import type { MonsterJSON } from './monsters/Monster';
import { MonsterFactory } from './monsters/MonsterFactory';

export type FloorKind = 'challenge' | 'combat' | 'treasure' | 'boss';

/** Расширяемые параметры этажа: добавляются полями, без смены типов */
export interface FloorParams {
  timeLimitMs?: number;
  poisonSeconds?: number;
  chests?: number;
}

export interface FloorJSON {
  floor: number;
  kind: FloorKind;
  monsters: MonsterJSON[];
  params: FloorParams;
  level: LevelJSON;
}

/** Этаж — текущая локация. Владеет монстрами; их состав — по бюджету уровня сложности. */
export class Floor {
  constructor(
    readonly floor: number,
    readonly kind: FloorKind,
    readonly monsters: readonly Monster[] = [],
    readonly params: FloorParams = {},
  ) {}

  get monsterCount(): number {
    return this.monsters.length;
  }

  get isCleared(): boolean {
    return this.monsters.every((monster) => monster.isDead);
  }

  /** Уровень сложности этого этажа (вычисляется из номера этажа) */
  get level(): Level {
    return Level.forFloor(this.floor);
  }

  toJSON(): FloorJSON {
    return {
      floor: this.floor,
      kind: this.kind,
      monsters: this.monsters.map((monster) => monster.toJSON()),
      params: this.params,
      level: this.level.toJSON(),
    };
  }

  static fromJSON(data: FloorJSON): Floor {
    return new Floor(data.floor, data.kind, data.monsters.map(MonsterFactory.fromJSON), data.params);
  }
}
