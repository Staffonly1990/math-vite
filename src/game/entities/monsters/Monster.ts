/**
 * Ранг монстра: «вес» в бюджете этажа и грубая сила.
 * Новые ранги — расширением union + записью в реестр MonsterFactory.
 */
export type MonsterRank = 1 | 2;

export interface MonsterJSON {
  kind: string;
  hp: number;
  maxHp: number;
  level: number;
}

/** Базовый класс монстра. Каждый уникальный монстр — свой класс-наследник. */
export abstract class Monster {
  /** дискриминатор для сериализации */
  abstract readonly kind: string;
  abstract readonly name: string;
  abstract readonly rank: MonsterRank;

  constructor(
    readonly hp: number,
    readonly maxHp: number,
    readonly level: number,
  ) {}

  abstract takeHit(damage?: number): Monster;

  get isDead(): boolean {
    return this.hp <= 0;
  }

  abstract toJSON(): MonsterJSON;
}
