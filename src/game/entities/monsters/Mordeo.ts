import { Monster } from './Monster';
import type { MonsterJSON, MonsterRank } from './Monster';

export interface MordeoJSON extends MonsterJSON {
  kind: 'mordeo';
}

/** Ядовитый монстр Крумы: ранг 2, сила 2. Каждое касание HP — +1 яда (правила — в Game). */
export class Mordeo extends Monster {
  readonly kind = 'mordeo';
  readonly name = 'Mordeo';
  readonly rank = 2 as MonsterRank;
  readonly poisonous = true;

  constructor(hp: number, level: number) {
    super(hp, hp, level);
  }

  takeHit(damage = 1): Mordeo {
    return new Mordeo(Math.max(0, this.hp - damage), this.level);
  }

  toJSON(): MordeoJSON {
    return { kind: this.kind, hp: this.hp, maxHp: this.maxHp, level: this.level };
  }

  static fromJSON(data: MordeoJSON): Mordeo {
    return new Mordeo(data.hp, data.level);
  }
}
