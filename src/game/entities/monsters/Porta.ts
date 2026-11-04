import { Monster } from './Monster';
import type { MonsterJSON, MonsterRank } from './Monster';

export interface PortaJSON extends MonsterJSON {
  kind: 'porta';
}

/** Обычный монстр Крумы: ранг 1, без способностей. Дефолтный житель этажа. */
export class Porta extends Monster {
  readonly kind = 'porta';
  readonly name = 'Porta';
  readonly rank = 1 as MonsterRank;

  constructor(hp: number, level: number) {
    super(hp, hp, level);
  }

  takeHit(damage = 1): Porta {
    return new Porta(Math.max(0, this.hp - damage), this.level);
  }

  toJSON(): PortaJSON {
    return { kind: this.kind, hp: this.hp, maxHp: this.maxHp, level: this.level };
  }

  static fromJSON(data: PortaJSON): Porta {
    return new Porta(data.hp, data.level);
  }
}
