import { Item } from './Item';
import type { ItemJSON } from './Item';

export interface ShieldPlateJSON extends ItemJSON {
  kind: 'shield';
}

/** Щитовая пластина: +1 щит (щит поглощает урон до HP и блокирует яд) */
export class ShieldPlate extends Item {
  readonly kind = 'shield' as const;
  readonly title = 'Щитовая пластина';
  readonly icon = '🛡️';

  constructor(readonly power = 1) {
    super();
  }

  toJSON(): ShieldPlateJSON {
    return { kind: this.kind };
  }

  static fromJSON(_data: ShieldPlateJSON): ShieldPlate {
    return new ShieldPlate();
  }
}
