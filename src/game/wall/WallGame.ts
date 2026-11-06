import { Rng } from '../rng';
import { ProblemFactory } from '../problem/ProblemFactory';
import type { Problem } from '../problem/Problem';
import type { ProblemJSON } from '../problem/Problem';
import { Player } from '../entities/Player';
import type { PlayerJSON } from '../entities/Player';

export type WallStatus = 'idle' | 'running' | 'gameover';
export type WallEndReason = 'wrong' | 'timeout' | 'lava' | 'surrender';

export interface WallStats {
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
}

export interface WallData {
  problem: Problem;
  cells: readonly number[];
  correctCell: number;
  poisonCell: number | null;
  bonusCell: number | null;
}

export interface WallGameJSON {
  status: WallStatus;
  endReason: WallEndReason | null;
  seed: number;
  index: number;
  level: number;
  aden: number;
  player: PlayerJSON;
  stats: WallStats;
  lavaReserveMs: number;
  lavaUpdatedAt: number;
  speedMultiplier: number;
  wallSpawnedAt: number;
  lastResult: 'correct' | 'wrong' | 'timeout' | null;
  lastCell: number | null;
  problem: ProblemJSON | null;
  cells: number[];
  correctCell: number;
  poisonCell: number | null;
  bonusCell: number | null;
}

/** Константы — тюнинг плейтестами */
export const LAVA_START_MS = 10_000;
export const LAVA_MAX_MS = 20_000;
export const LAVA_PER_CORRECT_MS = 2_000;
export const LAVA_PENALTY_MS = 1_000;
export const BASE_APPROACH_MS = 4_000;
export const MAX_SPEED = 3.0;
export const SPEED_STEP = 0.2;
export const LEVEL_UP_EVERY = 5;
export const POISON_CHANCE = 0.12;
export const BONUS_CHANCE = 0.06;

const EMPTY_STATS: WallStats = { correct: 0, wrong: 0, streak: 0, bestStreak: 0 };

function wallRng(seed: number, index: number): Rng {
  return new Rng(seed, 20_000 + index);
}

/** Собрать стену: задача из генератора + 4 ячейки + метки яда/бонуса */
function buildWall(seed: number, index: number, level: number): WallData {
  const rng = wallRng(seed, index);
  const problem = ProblemFactory.create(rng, { topic: 'arithmetic', level });
  const cells = [...problem.options];
  const correctCell = cells.indexOf(problem.answer);

  // яд: случайная неверная ячейка
  let poisonCell: number | null = null;
  if (rng.next() < POISON_CHANCE) {
    const wrongCells = cells.map((_, i) => i).filter((i) => i !== correctCell);
    poisonCell = wrongCells[Math.floor(rng.next() * wrongCells.length)] ?? null;
  }

  // бонус: редкая золотая ячейка (может быть даже верной!)
  let bonusCell: number | null = null;
  if (rng.next() < BONUS_CHANCE && poisonCell === null) {
    bonusCell = Math.floor(rng.next() * 4);
  }

  return { problem, cells, correctCell, poisonCell, bonusCell };
}

/**
 * FPV Wall Runner: стены-трапеции летят на игрока по 4-полосной дороге.
 * Тап по ячейке = пролёт через полосу. Лава = глобальный таймер.
 * Серия верных = мультипликатор скорости. Яд срезает лаву. Бонус лечит/щит.
 */
export class WallGame {
  constructor(
    readonly status: WallStatus = 'idle',
    readonly endReason: WallEndReason | null = null,
    readonly seed: number = 0,
    readonly index: number = 0,
    readonly level: number = 1,
    readonly aden: number = 0,
    readonly player: Player = new Player(),
    readonly stats: WallStats = EMPTY_STATS,
    readonly lavaReserveMs: number = LAVA_START_MS,
    readonly lavaUpdatedAt: number = 0,
    readonly speedMultiplier: number = 1,
    readonly wallSpawnedAt: number = 0,
    readonly lastResult: 'correct' | 'wrong' | 'timeout' | null = null,
    readonly lastCell: number | null = null,
    readonly wall: WallData | null = null,
  ) {}

  static idle(): WallGame {
    return new WallGame();
  }

  static start(seed: number, at: number): WallGame {
    const wall = buildWall(seed, 0, 1);
    return new WallGame(
      'running', null, seed, 0, 1, 0,
      new Player(), EMPTY_STATS,
      LAVA_START_MS, at, 1, at, null, null, wall,
    );
  }

  // ─── геометрия ───

  /** Дистанция стены: 1 = горизонт, 0 = игрок */
  wallDistance(at: number): number {
    if (this.status !== 'running' || !this.wall) return 1;
    const approach = BASE_APPROACH_MS / this.speedMultiplier;
    return Math.max(0, 1 - (at - this.wallSpawnedAt) / approach);
  }

  /** Время до столкновения (мс), 0 = уже late */
  wallTimeLeftMs(at: number): number {
    if (this.status !== 'running' || !this.wall) return 0;
    const approach = BASE_APPROACH_MS / this.speedMultiplier;
    return Math.max(0, this.wallSpawnedAt + approach - at);
  }

  // ─── действия ───

  tapCell(cellIndex: number, at: number): WallGame {
    if (this.status !== 'running' || !this.wall) return this;
    const correct = cellIndex === this.wall.correctCell;
    const isPoison = cellIndex === this.wall.poisonCell;
    const isBonus = cellIndex === this.wall.bonusCell;

    let player = this.player;
    let lavaDelta = 0;

    if (correct) {
      lavaDelta = LAVA_PER_CORRECT_MS;
    } else {
      // неверный ответ: урон от стены; яд — если ядовитая ячейка
      const { player: hitPlayer, touchedHp } = player.takeHit(isPoison ? 2 : 1);
      player = isPoison && touchedHp ? hitPlayer.applyPoison() : hitPlayer;
      lavaDelta = -LAVA_PENALTY_MS;
      if (player.isDead) {
        return this.gameover('wrong', at, { ...this.stats, wrong: this.stats.wrong + 1, streak: 0 }, player, cellIndex);
      }
    }

    // бонус-ячейка (может совпасть с верным или неверным)
    if (isBonus) {
      const roll = wallRng(this.seed, this.index).next();
      if (roll < 0.4) player = player.heal('full');
      else if (roll < 0.7) player = player.addShield(1);
      else lavaDelta += 3_000;
    }

    const streak = correct ? this.stats.streak + 1 : 0;
    const stats: WallStats = correct
      ? { correct: this.stats.correct + 1, wrong: this.stats.wrong, streak, bestStreak: Math.max(this.stats.bestStreak, streak) }
      : { correct: this.stats.correct, wrong: this.stats.wrong + 1, streak: 0, bestStreak: this.stats.bestStreak };

    const speedMultiplier = correct
      ? Math.min(MAX_SPEED, this.speedMultiplier + SPEED_STEP)
      : 1;

    const level = 1 + Math.floor(stats.correct / LEVEL_UP_EVERY);
    const adenGain = correct ? this.level : 0;
    const nextIndex = this.index + 1;
    const nextWall = buildWall(this.seed, nextIndex, level);
    const lava = Math.max(0, Math.min(LAVA_MAX_MS, this.lavaReserveMs + lavaDelta));

    return new WallGame(
      'running', null, this.seed, nextIndex, level,
      this.aden + adenGain, player, stats,
      lava, at, speedMultiplier, at,
      correct ? 'correct' : 'wrong', cellIndex, nextWall,
    );
  }

  /** Тик лавы + проверка таймаута стены */
  tick(at: number): WallGame {
    if (this.status !== 'running') return this;

    // лава тает
    const elapsed = Math.max(0, at - this.lavaUpdatedAt);
    const lava = this.lavaReserveMs - elapsed;
    if (lava <= 0) {
      return this.gameover('lava', at, this.stats, this.player);
    }

    // стена доехала без тапа = авто-промах
    if (this.wall && this.wallTimeLeftMs(at) <= 0) {
      const stats: WallStats = { ...this.stats, wrong: this.stats.wrong + 1, streak: 0 };
      const nextIndex = this.index + 1;
      const level = 1 + Math.floor(stats.correct / LEVEL_UP_EVERY);
      const nextWall = buildWall(this.seed, nextIndex, level);
      return new WallGame(
        'running', null, this.seed, nextIndex, level,
        this.aden, this.player, stats,
        Math.max(0, lava - LAVA_PENALTY_MS), at,
        1, at, 'timeout', null, nextWall,
      );
    }

    return new WallGame(
      this.status, this.endReason, this.seed, this.index, this.level,
      this.aden, this.player, this.stats,
      lava, at, this.speedMultiplier, this.wallSpawnedAt,
      this.lastResult, this.lastCell, this.wall,
    );
  }

  surrender(at: number): WallGame {
    if (this.status !== 'running') return this;
    return this.gameover('surrender', at, { ...this.stats, streak: 0 }, this.player);
  }

  // ─── сериализация ───

  toJSON(): WallGameJSON {
    return {
      status: this.status,
      endReason: this.endReason,
      seed: this.seed,
      index: this.index,
      level: this.level,
      aden: this.aden,
      player: this.player.toJSON(),
      stats: this.stats,
      lavaReserveMs: this.lavaReserveMs,
      lavaUpdatedAt: this.lavaUpdatedAt,
      speedMultiplier: this.speedMultiplier,
      wallSpawnedAt: this.wallSpawnedAt,
      lastResult: this.lastResult,
      lastCell: this.lastCell,
      problem: this.wall?.problem.toJSON() ?? null,
      cells: this.wall ? [...this.wall.cells] : [],
      correctCell: this.wall?.correctCell ?? -1,
      poisonCell: this.wall?.poisonCell ?? null,
      bonusCell: this.wall?.bonusCell ?? null,
    };
  }

  static fromJSON(data: WallGameJSON): WallGame {
    const problem = data.problem ? ProblemFactory.fromJSON(data.problem) : null;
    const wall: WallData | null = problem
      ? { problem, cells: data.cells, correctCell: data.correctCell, poisonCell: data.poisonCell, bonusCell: data.bonusCell }
      : null;
    return new WallGame(
      data.status, data.endReason, data.seed, data.index, data.level,
      data.aden, Player.fromJSON(data.player), data.stats,
      data.lavaReserveMs, data.lavaUpdatedAt, data.speedMultiplier,
      data.wallSpawnedAt, data.lastResult, data.lastCell, wall,
    );
  }

  private gameover(
    reason: WallEndReason, at: number, stats: WallStats, player: Player, lastCell?: number,
  ): WallGame {
    return new WallGame(
      'gameover', reason, this.seed, this.index, this.level,
      this.aden, player, stats,
      Math.max(0, this.lavaReserveMs), at, this.speedMultiplier,
      this.wallSpawnedAt, reason === 'wrong' ? 'wrong' : null, lastCell ?? null, this.wall,
    );
  }
}
