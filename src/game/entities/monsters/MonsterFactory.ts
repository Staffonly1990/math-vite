import type { Rng } from '../../rng';
import { Level } from '../Level';
import { Mordeo } from './Mordeo';
import type { MordeoJSON } from './Mordeo';
import { Monster } from './Monster';
import type { MonsterJSON, MonsterRank } from './Monster';
import { Porta } from './Porta';
import type { PortaJSON } from './Porta';

type MonsterConstructor = new (hp: number, level: number) => Monster;

/**
 * Реестр монстров по рангам: новый монстр/ранг — запись здесь.
 * Тип Record<MonsterRank, ...> заставляет компилятор указать на незарегистрированный ранг.
 */
const RANKED_MONSTERS: { readonly [R in MonsterRank]: readonly MonsterConstructor[] } = {
  1: [Porta],
  2: [Mordeo],
};

const CRUMA_BASE_LEVEL = 40; // Крума в L2 начинается с ~40-го

export class MonsterFactory {
  /** HP монстра растёт с рангом и уровнем сложности: ранг × уровень */
  static hp(rank: MonsterRank, level: Level): number {
    return rank * level.number;
  }

  /**
   * Состав монстров этажа по вычисляемому бюджету уровня: сумма рангов = бюджет.
   * Бюджет 3 может дать [1,1,1], [2,1] или [1,2] — какое разбиение, решает rng.
   */
  static composeForLevel(level: Level, floorNumber: number, rng: Rng): Monster[] {
    const monsters: Monster[] = [];
    let rest = level.monsterBudget;
    while (rest > 0) {
      const ceiling = Math.min(level.maxRank, rest);
      const rank: MonsterRank =
        ceiling === 1
          ? 1
          : (rng.pick(Array.from({ length: ceiling }, (_, i) => i + 1)) as MonsterRank);
      const Ctor = rng.pick(RANKED_MONSTERS[rank]);
      monsters.push(new Ctor(MonsterFactory.hp(rank, level), CRUMA_BASE_LEVEL + floorNumber));
      rest -= rank;
    }
    return monsters;
  }

  static fromJSON(data: MonsterJSON): Monster {
    switch (data.kind) {
      case 'porta':
        return Porta.fromJSON(data as unknown as PortaJSON);
      case 'mordeo':
        return Mordeo.fromJSON(data as unknown as MordeoJSON);
      default:
        throw new Error(`Неизвестный монстр: ${String(data.kind)}`);
    }
  }
}
