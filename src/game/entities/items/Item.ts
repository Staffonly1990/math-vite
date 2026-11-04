/**
 * Базовый класс предмета. Сила (power) — задел: сейчас бутыли действуют
 * «на всё», позже сила будет регулировать объём. Эффекты применяет Game.useItem.
 */
export type ItemKind = 'heal' | 'antidote' | 'shield' | 'freeze';

export interface ItemJSON {
  kind: string;
}

export abstract class Item {
  abstract readonly kind: ItemKind;
  /** Название для UI/инвентаря */
  abstract readonly title: string;
  abstract readonly icon: string;

  abstract toJSON(): ItemJSON;
}
