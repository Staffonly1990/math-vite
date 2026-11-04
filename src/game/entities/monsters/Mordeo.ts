import { Monster } from './Monster';
import type { MonsterJSON, MonsterRank } from './Monster';

export interface MordeoJSON extends MonsterJSON {
  kind: 'mordeo';
  poisonSeconds: number;
}

/** Ядовитый монстр Крумы: ранг 2. Яд срезает локальное время этажа (Phase 1 подключит). */
export class Mordeo extends Monster {
  readonly kind = 'mordeo';
  readonly name = 'Mordeo';
  readonly rank = 2 as MonsterRank;

  constructor(hp: number, level: number, readonly poisonSeconds = 3) {
    super(hp, hp, level);
  }

  /** Способность: сколько секунд локального времени срежет яд при встрече */
  poison(): number {
    return this.poisonSeconds;
  }

  takeHit(damage = 1): Mordeo {
    return new Mordeo(Math.max(0, this.hp - damage), this.level, this.poisonSeconds);
  }

  toJSON(): MordeoJSON {
    return {
      kind: this.kind,
      hp: this.hp,
      maxHp: this.maxHp,
      level: this.level,
      poisonSeconds: this.poisonSeconds,
    };
  }

  static fromJSON(data: MordeoJSON): Mordeo {
    return new Mordeo(data.hp, data.level, data.poisonSeconds);
  }
}
