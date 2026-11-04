import { Rng } from '../rng';
import { ProblemFactory } from '../problem/ProblemFactory';
import type { Problem } from '../problem/Problem';
import type { ProblemJSON } from '../problem/Problem';
import { ItemFactory } from './items/ItemFactory';
import type { Item, ItemJSON } from './items/Item';
import type { FreezeCore } from './items/FreezeCore';
import { Player } from './Player';
import type { PlayerJSON } from './Player';
import { Floor } from './Floor';
import type { FloorJSON } from './Floor';
import { FloorFactory } from './FloorFactory';
import { Level } from './Level';

export type SessionStatus = 'idle' | 'running' | 'gameover';

/** Чем закончился забег: ошибка, бегство (SOE), лава или HP. */
export type EndReason = 'wrong' | 'surrender' | 'lava' | 'hp';

export interface SessionStats {
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
}

export interface GameJSON {
  status: SessionStatus;
  seed: number;
  index: number;
  problem: ProblemJSON | null;
  player: PlayerJSON;
  stats: SessionStats;
  floor: FloorJSON | null;
  startedAt: number | null;
  endedAt: number | null;
  lastAnswer: 'correct' | 'wrong' | null;
  endReason: EndReason | null;
  lavaReserveMs: number;
  lavaUpdatedAt: number;
  frozenUntilMs: number;
  frozenAccumMs: number;
  answerStartedAt: number;
  items: ItemJSON[];
  chestsOpened: boolean[];
}

/** Константы башни — тюнинг плейтестами */
export const LAVA_START_MS = 10_000;
export const LAVA_MAX_MS = 30_000;
export const LAVA_PER_FLOOR_MS = 5_000;
export const PLAYER_HIT_DAMAGE = 1;
export const TRAP_CHEST_DAMAGE = 1;

const EMPTY_STATS: SessionStats = { correct: 0, wrong: 0, streak: 0, bestStreak: 0 };

/** Разные rng-потоки забега: задачи / монстры / сундуки — не пересекаются */
function problemRng(seed: number, index: number): Rng {
  return new Rng(seed, index);
}
function monsterRng(seed: number, floorNumber: number): Rng {
  return new Rng(seed, 50_000 + floorNumber);
}
function chestRng(seed: number, floorNumber: number, chestIndex: number): Rng {
  return new Rng(seed, 90_000 + floorNumber * 100 + chestIndex);
}

/**
 * Оркестратор забега по бесконечной башне Крумы.
 *
 * Лава: глобальный запас времени, пополняется на каждом новом этаже; пауз нет
 * никогда (wall-clock: Ticks передают время снаружи, замёрзшая вкладка догоняется
 * одним вычетом). Заморозка мира (ядро) — единственное, что останавливает лаву.
 *
 * Бой: монстр сам не атакует — идёт пример. Верный ответ = удар игрока по монстру,
 * неверный или таймаут = удар монстра по игроку (щит/яд — по правилам Player).
 */
export class Game {
  constructor(
    readonly status: SessionStatus,
    readonly seed: number,
    readonly index: number,
    readonly problem: Problem | null,
    readonly player: Player,
    readonly stats: SessionStats,
    readonly floor: Floor | null = null,
    readonly startedAt: number | null = null,
    readonly endedAt: number | null = null,
    readonly lastAnswer: 'correct' | 'wrong' | null = null,
    readonly endReason: EndReason | null = null,
    readonly lavaReserveMs: number = LAVA_START_MS,
    readonly lavaUpdatedAt: number = 0,
    readonly frozenUntilMs: number = 0,
    readonly frozenAccumMs: number = 0,
    readonly answerStartedAt: number = 0,
    readonly items: readonly Item[] = [],
    readonly chestsOpened: readonly boolean[] = [],
  ) {}

  static idle(): Game {
    return new Game('idle', 0, 0, null, new Player(), EMPTY_STATS);
  }

  static start(seed: number, at: number): Game {
    const floor = FloorFactory.tower(1, monsterRng(seed, 1));
    return new Game(
      'running',
      seed,
      0,
      ProblemFactory.create(problemRng(seed, 0), { topic: 'arithmetic', level: floor.level.number }),
      new Player(),
      EMPTY_STATS,
      floor,
      at,
      null,
      null,
      null,
      LAVA_START_MS,
      at,
      0,
      0,
      at,
      [],
      chestsFor(floor),
    );
  }

  // ─── геттеры для селекторов UI ───

  get aden(): number {
    return this.player.aden;
  }

  get floorNumber(): number {
    return this.floor?.floor ?? 0;
  }

  get level(): Level {
    return this.floor ? this.floor.level : Level.first();
  }

  /** Первый живой монстр этажа — текущая цель боя */
  get activeMonster() {
    return this.floor?.monsters.find((monster) => !monster.isDead) ?? null;
  }

  /** Локальное время на ответ есть только в бою с живыми монстрами (яд срезает секунды) */
  get answerTimeLimitMs(): number {
    if (!this.floor || this.floor.kind !== 'combat' || this.floor.isCleared) return 0;
    const limit = this.floor.params.timeLimitMs ?? 0;
    return Math.max(0, limit - this.player.poisonSeconds * 1000);
  }

  /** Сколько реально прошло от начала ответа (замороженное время вычтено) */
  answerElapsedMs(at: number): number {
    return Math.max(0, at - this.answerStartedAt - this.frozenAccumMs);
  }

  // ─── ответы ───

  answer(value: number, at: number): Game {
    if (this.status !== 'running' || !this.problem || !this.floor) return this;
    const correct = this.problem.isCorrect(value);

    // бой: пока есть живые монстры, верный ответ бьёт, неверный — удар монстра
    if (this.floor.kind === 'combat' && this.activeMonster) {
      if (!correct) return this.monsterHit(at);
      const monster = this.activeMonster;
      const wounded = monster.takeHit(PLAYER_HIT_DAMAGE);
      const monsters = this.floor.monsters.map((m) => (m === monster ? wounded : m));
      const floor = new Floor(this.floor.floor, this.floor.kind, monsters, this.floor.params);
      // зачистка НЕ поднимает выше: дальше фаза двери — ещё один пример
      return this.nextProblem(at, floor, 'correct', this.player, this.statsAfterCorrect());
    }

    // фаза двери (дверные этажи, бой после зачистки): верный ответ открывает дверь,
    // неверный фатален — бить некому. Сокровищница выходит выбором сундука/пропуска.
    if (this.floor.kind === 'treasure') return this;
    if (correct) {
      return this.advance(at, this.statsAfterCorrect(), 'correct');
    }
    return this.gameover('wrong', at, { ...this.stats, wrong: this.stats.wrong + 1, streak: 0 });
  }

  /** Удар монстра по игроку (неверный ответ или таймаут) */
  private monsterHit(at: number): Game {
    const monster = this.activeMonster;
    if (!monster || !this.floor) return this;
    const { player: hitPlayer, touchedHp } = this.player.takeHit(monster.strength);
    const player = monster.poisonous && touchedHp ? hitPlayer.applyPoison() : hitPlayer;
    const stats: SessionStats = { ...this.stats, wrong: this.stats.wrong + 1, streak: 0 };

    if (player.isDead) {
      return this.gameover('hp', at, stats, player);
    }
    return this.nextProblem(at, this.floor, 'wrong', player, stats);
  }

  /** Локальный таймаут есть только в бою: не успел — монстр бьёт */
  floorTimeout(at: number): Game {
    if (this.status !== 'running' || !this.floor || this.floor.kind !== 'combat') return this;
    if (at < this.frozenUntilMs) return this; // мир заморожен
    if (this.answerElapsedMs(at) < this.answerTimeLimitMs) return this; // ещё есть время (гонка с ответом)
    return this.monsterHit(at);
  }

  // ─── лава ───

  /** Тик лавы: вычет wall-clock прошедшего времени. Пауз не бывает никогда (кроме заморозки мира). */
  tick(at: number): Game {
    if (this.status !== 'running') return this;
    if (at < this.frozenUntilMs) {
      // мир заморожен: лава стоит, а замороженный отрезок копится для таймера ответа
      const frozen = Math.max(0, at - this.lavaUpdatedAt);
      return this.with({ lavaUpdatedAt: at, frozenAccumMs: this.frozenAccumMs + frozen });
    }
    const elapsed = Math.max(0, at - this.lavaUpdatedAt);
    const reserve = this.lavaReserveMs - elapsed;
    if (reserve <= 0) {
      return this.gameover('lava', at, this.stats);
    }
    return this.with({ lavaReserveMs: reserve, lavaUpdatedAt: at });
  }

  // ─── предметы ───

  useItem(itemIndex: number, at: number): Game {
    if (this.status !== 'running') return this;
    const item = this.items[itemIndex];
    if (!item) return this;
    const items = this.items.filter((_, i) => i !== itemIndex);

    let player = this.player;
    let frozenUntilMs = this.frozenUntilMs;
    let lavaUpdatedAt = this.lavaUpdatedAt;
    switch (item.kind) {
      case 'heal': player = player.heal('full'); break;
      case 'antidote': player = player.clearPoison(); break;
      case 'shield': player = player.addShield(1); break;
      case 'freeze':
        frozenUntilMs = Math.max(frozenUntilMs, at) + (item as FreezeCore).powerMs;
        lavaUpdatedAt = at; // заморозка стартует с этой точки
        break;
    }
    return this.with({ items, player, frozenUntilMs, lavaUpdatedAt });
  }

  /**
   * Открыть ОДИН сундук: предмет в инвентарь или ловушка (урон + яд).
   * Любой выбор немедленно уводит на следующий этаж — мульти-сундуков нет.
   */
  openChest(chestIndex: number, at: number): Game {
    if (this.status !== 'running' || !this.floor || this.floor.kind !== 'treasure') return this;
    if (this.chestsOpened[chestIndex]) return this;

    const content = ItemFactory.rollChest(chestRng(this.seed, this.floor.floor, chestIndex));
    const chestsOpened = this.chestsOpened.map((opened, i) => (i === chestIndex ? true : opened));

    if (content.kind === 'item') {
      return this
        .with({ chestsOpened, items: [...this.items, content.item] })
        .advanceInternal(at);
    }

    // ловушка: взрыв бьёт и травит (яд — при касании HP)
    const { player: hitPlayer, touchedHp } = this.player.takeHit(TRAP_CHEST_DAMAGE);
    const player = touchedHp ? hitPlayer.applyPoison() : hitPlayer;
    if (player.isDead) {
      return this.gameover('hp', at, this.stats, player, { chestsOpened });
    }
    return this.with({ chestsOpened, player }).advanceInternal(at);
  }

  /** Пропустить сундуки и сразу подняться выше */
  skipChests(at: number): Game {
    if (this.status !== 'running' || !this.floor || this.floor.kind !== 'treasure') return this;
    return this.advanceInternal(at);
  }

  surrender(at: number): Game {
    if (this.status !== 'running') return this;
    return this.gameover('surrender', at, { ...this.stats, streak: 0 }, this.player);
  }

  // ─── внутренние переходы ───

  private statsAfterCorrect(): SessionStats {
    const streak = this.stats.streak + 1;
    return {
      ...this.stats,
      correct: this.stats.correct + 1,
      streak,
      bestStreak: Math.max(this.stats.bestStreak, streak),
    };
  }

  /** Этаж пройден: подъём, пополнение лавы, выдох яда, адена уровнем этажа */
  /** внутренний подъём без смены статов (сундук/пропуск) */
  private advanceInternal(at: number): Game {
    return this.advance(at, this.stats, null);
  }

  private advance(at: number, stats: SessionStats, lastAnswer: 'correct' | null, floorOverride?: Floor): Game {
    const leftFloor = floorOverride ?? this.floor!;
    const nextNumber = leftFloor.floor + 1;
    const nextFloor = FloorFactory.tower(nextNumber, monsterRng(this.seed, nextNumber));
    const index = this.index + 1;
    const player = this.player.tickPoisonFloor().awardAden(leftFloor.level.number);
    return new Game(
      'running',
      this.seed,
      index,
      ProblemFactory.create(problemRng(this.seed, index), { topic: 'arithmetic', level: nextFloor.level.number }),
      player,
      stats,
      nextFloor,
      this.startedAt,
      null,
      lastAnswer,
      null,
      Math.min(LAVA_MAX_MS, this.lavaReserveMs + LAVA_PER_FLOOR_MS),
      at,
      this.frozenUntilMs,
      0,
      at,
      this.items,
      chestsFor(nextFloor),
    );
  }

  /** Новый пример в бою (этаж тот же) */
  private nextProblem(
    at: number,
    floor: Floor,
    lastAnswer: 'correct' | 'wrong',
    player: Player,
    stats: SessionStats,
  ): Game {
    const index = this.index + 1;
    return new Game(
      'running',
      this.seed,
      index,
      ProblemFactory.create(problemRng(this.seed, index), { topic: 'arithmetic', level: floor.level.number }),
      player,
      stats,
      floor,
      this.startedAt,
      null,
      lastAnswer,
      null,
      this.lavaReserveMs,
      at,
      this.frozenUntilMs,
      0,
      at,
      this.items,
      this.chestsOpened,
    );
  }

  private gameover(
    reason: EndReason,
    at: number,
    stats: SessionStats,
    player: Player = this.player,
    extra: Partial<Game> = {},
  ): Game {
    return this.with({ status: 'gameover', endedAt: at, endReason: reason, stats, player, ...extra });
  }

  private with(patch: Partial<Game>): Game {
    return new Game(
      patch.status ?? this.status,
      this.seed,
      this.index,
      patch.problem ?? this.problem,
      patch.player ?? this.player,
      patch.stats ?? this.stats,
      patch.floor ?? this.floor,
      this.startedAt,
      patch.endedAt ?? this.endedAt,
      patch.lastAnswer ?? this.lastAnswer,
      patch.endReason ?? this.endReason,
      patch.lavaReserveMs ?? this.lavaReserveMs,
      patch.lavaUpdatedAt ?? this.lavaUpdatedAt,
      patch.frozenUntilMs ?? this.frozenUntilMs,
      patch.frozenAccumMs ?? this.frozenAccumMs,
      patch.answerStartedAt ?? this.answerStartedAt,
      patch.items ?? this.items,
      patch.chestsOpened ?? this.chestsOpened,
    );
  }

  toJSON(): GameJSON {
    return {
      status: this.status,
      seed: this.seed,
      index: this.index,
      problem: this.problem?.toJSON() ?? null,
      player: this.player.toJSON(),
      stats: this.stats,
      floor: this.floor?.toJSON() ?? null,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      lastAnswer: this.lastAnswer,
      endReason: this.endReason,
      lavaReserveMs: this.lavaReserveMs,
      lavaUpdatedAt: this.lavaUpdatedAt,
      frozenUntilMs: this.frozenUntilMs,
      frozenAccumMs: this.frozenAccumMs,
      answerStartedAt: this.answerStartedAt,
      items: this.items.map((item) => item.toJSON()),
      chestsOpened: [...this.chestsOpened],
    };
  }

  static fromJSON(data: GameJSON): Game {
    return new Game(
      data.status,
      data.seed,
      data.index,
      data.problem ? ProblemFactory.fromJSON(data.problem) : null,
      Player.fromJSON(data.player),
      data.stats,
      data.floor ? Floor.fromJSON(data.floor) : null,
      data.startedAt,
      data.endedAt,
      data.lastAnswer,
      data.endReason,
      data.lavaReserveMs,
      data.lavaUpdatedAt,
      data.frozenUntilMs,
      data.frozenAccumMs,
      data.answerStartedAt,
      data.items.map(ItemFactory.fromJSON),
      data.chestsOpened,
    );
  }
}

function chestsFor(floor: Floor): boolean[] {
  return Array.from({ length: floor.params.chests ?? 0 }, () => false);
}
