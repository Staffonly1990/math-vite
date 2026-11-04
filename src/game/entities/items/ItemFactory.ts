import type { Rng } from '../../rng';
import { Antidote } from './Antidote';
import type { AntidoteJSON } from './Antidote';
import { FreezeCore } from './FreezeCore';
import type { FreezeCoreJSON } from './FreezeCore';
import { HealPotion } from './HealPotion';
import type { HealPotionJSON } from './HealPotion';
import { Item } from './Item';
import type { ItemJSON, ItemKind } from './Item';
import { ShieldPlate } from './ShieldPlate';
import type { ShieldPlateJSON } from './ShieldPlate';

/** Что лежит в сундуке: предмет или ловушка (взрыв: урон + яд) */
export type ChestContent = { kind: 'trap' } | { kind: 'item'; item: Item };

type ItemConstructor = new () => Item;

/** Реестр предметов: новый предмет — запись здесь (компилятор проверит полноту по ItemKind) */
const ITEMS: { readonly [K in ItemKind]: ItemConstructor } = {
  heal: HealPotion,
  antidote: Antidote,
  shield: ShieldPlate,
  freeze: FreezeCore,
};

export class ItemFactory {
  static fromJSON(data: ItemJSON): Item {
    switch (data.kind) {
      case 'heal': return HealPotion.fromJSON(data as unknown as HealPotionJSON);
      case 'antidote': return Antidote.fromJSON(data as unknown as AntidoteJSON);
      case 'shield': return ShieldPlate.fromJSON(data as unknown as ShieldPlateJSON);
      case 'freeze': return FreezeCore.fromJSON(data as unknown as FreezeCoreJSON);
      default:
        throw new Error(`Неизвестный предмет: ${String(data.kind)}`);
    }
  }

  /** Рулетка сундука: ~20% ловушка, остальное — предметы */
  static rollChest(rng: Rng): ChestContent {
    const roll = rng.next();
    if (roll < 0.2) return { kind: 'trap' };
    const table: readonly ItemKind[] = ['heal', 'heal', 'heal', 'antidote', 'antidote', 'shield', 'shield', 'freeze', 'freeze'];
    const kind = table[Math.floor(rng.next() * table.length)] as ItemKind;
    return { kind: 'item', item: new ITEMS[kind]() };
  }
}
