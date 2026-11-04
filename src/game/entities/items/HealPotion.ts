import { Item } from './Item';
import type { ItemJSON } from './Item';

export interface HealPotionJSON extends ItemJSON {
  kind: 'heal';
}

/** Бутыль лечения: восстанавливает здоровье (сила — задел, сейчас — полностью) */
export class HealPotion extends Item {
  readonly kind = 'heal' as const;
  readonly title = 'Бутыль лечения';
  readonly icon = '🧪';

  constructor(readonly power: number | 'full' = 'full') {
    super();
  }

  toJSON(): HealPotionJSON {
    return { kind: this.kind };
  }

  static fromJSON(_data: HealPotionJSON): HealPotion {
    return new HealPotion();
  }
}
