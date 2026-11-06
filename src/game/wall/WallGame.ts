import { Rng } from '../rng';
import { ProblemFactory } from '../problem/ProblemFactory';
import type { Problem } from '../problem/Problem';
import type { ProblemJSON } from '../problem/Problem';

export type WallStatus = 'idle' | 'running';
export type WallResult = 'correct' | 'wrong' | 'miss' | null;

export interface WallStats {
  correct: number;
  wrong: number;
  miss: number;
  streak: number;
  bestStreak: number;
}

export interface WallData {
  problem: Problem;
  cells: readonly number[];
  correctCell: number;
  /** центр зоны ×2 на дистанции подлёта (0=удар, 1=шапка) */
  zoneCenter: number;
  /** полуширина зоны ×2 — сжимается с уровнем, ловить сложнее */
  zoneHalf: number;
}

export interface WallGameJSON {
  status: WallStatus;
  seed: number;
  index: number;
  aden: number;
  peakLevel: number;
  stats: WallStats;
  wallSpawnedAt: number;
  lastResult: WallResult;
  lastMult: number;
  lastCell: number | null;
  problem: ProblemJSON | null;
  cells: number[];
  correctCell: number;
  zoneCenter: number;
  zoneHalf: number;
}

/**
 * Экономика v2 «баланс = уровень» (тюнинг плейтестом):
 *   верный = +1 аден (×2 в золотой зоне на дороге — у каждой стены своя, случайно);
 *   ошибка/прос = −1 (яд −2); баланс цел и не падает ниже 0;
 *   уровень = f(баланс), пороги 6, 16, 26… — игра бесконечна, смерти нет.
 */
export const ADEN_LEVEL1 = 6;
export const ADEN_PER_LEVEL = 10;
/** подлёт стены на базовой скорости — долгий, чтобы вкатываться плавно */
export const BASE_APPROACH_MS = 6500;
export const MAX_SPEED = 3.0;

/**
 * КРИВАЯ СЛОЖНОСТИ «одна ось за раз» (input → content → tempo, с отдыхом):
 *   L0 старт 2 полосы «+» ×1 → L1 +полоса → L2 +«−» → L3 +полоса → L4 +«×»
 *   → L5 +«÷» (контент собран на медленном темпе) → L6 скорость ×2
 *   → L7 отдых (числа шире) → L8 скорость ×3 → L9+ числа растут бесконечно.
 * Полосы и математика НИКОГДА не растут в один уровень; темп приходит
 * после освоения контента; каждые несколько уровней — уровень-закрепление.
 */
export const SPEED_X2_LEVEL = 6;
export const SPEED_X3_LEVEL = 8;

/**
 * Зона ×2: с ростом уровня отрезок МЕНЬШЕ — множитель сложнее уловить.
 * Полуширина в дистанциях подлёта (0=удар, 1=шапка).
 */
export const ZONE_HALF_BASE = 0.045;
export const ZONE_HALF_PER_LEVEL = 0.004;
export const ZONE_HALF_MIN = 0.015;

/** Половина «роста» стены в дистанциях (плита 100px на пути 628px) */
export const WALL_SPAN_HALF = 0.08;

/** Центр зоны ×2 — случайное место, у каждого примера своё; не выше шапки */
export const ZONE_CENTER_MIN = 0.15;
export const ZONE_CENTER_MAX = 0.8;

/** Полуширина зоны ×2 на данном уровне */
export function zoneHalfForLevel(level: number): number {
  return Math.max(ZONE_HALF_MIN, ZONE_HALF_BASE - ZONE_HALF_PER_LEVEL * Math.max(0, level));
}

/** ×2 засчитывается, если плита стены ЗАДЕВАЕТ отрезок зоны в момент верного ответа */
export function zoneHit(distance: number, zoneCenter: number, zoneHalf: number): boolean {
  return Math.abs(distance - zoneCenter) <= zoneHalf + WALL_SPAN_HALF;
}

/** Кумулятивный порог уровня N (N ≥ 1): 6, 16, 26… */
export function adenThreshold(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return ADEN_LEVEL1 + ADEN_PER_LEVEL * (n - 1);
}

/** Уровень = f(баланса аденов) */
export function levelForAden(aden: number): number {
  const a = Math.max(0, Math.floor(aden));
  if (a < ADEN_LEVEL1) return 0;
  return 1 + Math.floor((a - ADEN_LEVEL1) / ADEN_PER_LEVEL);
}

/** Полосы дороги: ур.0 → 2 (коридор), ур.1–2 → 3, ур.3+ → 4 */
export function lanesForLevel(level: number): number {
  const l = Math.max(0, level);
  return l === 0 ? 2 : l <= 2 ? 3 : 4;
}

/** Математика: ур.0–1 = «+», 2–3 = «+−», 4 = «+−×», 5 = «+−×÷», 6+ = диапазоны растут */
export function mathLevelForLevel(level: number): number {
  const l = Math.max(0, level);
  if (l <= 1) return 1;
  if (l <= 3) return 2;
  if (l === 4) return 3;
  if (l === 5) return 4;
  return l - 1;
}

/** Скорость — только целые: ×1 до ур.6, ×2 до ур.8, дальше ×3 */
export function speedForLevel(level: number): number {
  const l = Math.max(0, level);
  return l >= SPEED_X3_LEVEL ? 3 : l >= SPEED_X2_LEVEL ? 2 : 1;
}

const EMPTY_STATS: WallStats = { correct: 0, wrong: 0, miss: 0, streak: 0, bestStreak: 0 };

function wallRng(seed: number, index: number): Rng {
  return new Rng(seed, 20_000 + index);
}

/** Собрать стену: задача + ячейки по числу полос + зона ×2 */
function buildWall(seed: number, index: number, level: number): WallData {
  const rng = wallRng(seed, index);
  const lanes = lanesForLevel(level);
  const problem = ProblemFactory.create(rng, {
    topic: 'arithmetic',
    level: mathLevelForLevel(level),
    optionsCount: lanes,
  });
  const cells = [...problem.options];
  const correctCell = cells.indexOf(problem.answer);

  // зона ×2: случайное место на подлёте, размер — от уровня
  const zoneCenter = ZONE_CENTER_MIN + rng.next() * (ZONE_CENTER_MAX - ZONE_CENTER_MIN);
  const zoneHalf = zoneHalfForLevel(level);

  return { problem, cells, correctCell, zoneCenter, zoneHalf };
}

/**
 * FPV Wall Runner v2: игра без смерти, сложность = пульс.
 * Единственное живое состояние — баланс аденов: верные копят (×2/×3 в зонах риска),
 * ошибки и просы списывают; уровень = f(баланса), прос на нуле бесплатен.
 */
export class WallGame {
  constructor(
    readonly status: WallStatus = 'idle',
    readonly seed: number = 0,
    readonly index: number = 0,
    readonly aden: number = 0,
    readonly peakLevel: number = 0,
    readonly stats: WallStats = EMPTY_STATS,
    readonly wallSpawnedAt: number = 0,
    readonly lastResult: WallResult = null,
    readonly lastMult: number = 0,
    readonly lastCell: number | null = null,
    readonly wall: WallData | null = null,
  ) {}

  get level(): number { return levelForAden(this.aden); }
  get speedMultiplier(): number { return speedForLevel(this.level); }
  get lanes(): number { return lanesForLevel(this.level); }

  static idle(): WallGame {
    return new WallGame();
  }

  static start(seed: number, at: number): WallGame {
    return new WallGame('running', seed, 0, 0, 0, EMPTY_STATS, at, null, 0, null, buildWall(seed, 0, 0));
  }

  // ─── геометрия ───

  /** Дистанция стены: 1 = горизонт, 0 = игрок */
  wallDistance(at: number): number {
    if (this.status !== 'running' || !this.wall) return 1;
    const approach = BASE_APPROACH_MS / this.speedMultiplier;
    return Math.max(0, 1 - (at - this.wallSpawnedAt) / approach);
  }

  /** Время до сгорания стены (нижняя кромка коснётся линии), мс */
  wallTimeLeftMs(at: number): number {
    if (this.status !== 'running' || !this.wall) return 0;
    const approach = BASE_APPROACH_MS / this.speedMultiplier;
    const elapsedToBurn = approach * (1 - WALL_SPAN_HALF);
    return Math.max(0, this.wallSpawnedAt + elapsedToBurn - at);
  }

  /**
   * Подглядеть следующую стену (очередь «далее» на трассе).
   * Строится по текущему уровню: если ответ сменит уровень — реальная стена
   * будет чуть другой, превью честно перерисуется.
   */
  peekNext(): WallData | null {
    if (this.status !== 'running') return null;
    return buildWall(this.seed, this.index + 1, this.level);
  }

  // ─── действия ───

  tapCell(cellIndex: number, at: number): WallGame {
    if (this.status !== 'running' || !this.wall) return this;
    const correct = cellIndex === this.wall.correctCell;

    // ×2, если плита стены задевает свой золотой отрезок в момент тапа
    const d = this.wallDistance(at);
    const mult = zoneHit(d, this.wall.zoneCenter, this.wall.zoneHalf) ? 2 : 1;

    const delta = correct ? mult : -1;

    // на нуле ошибка БЕСПЛАТНА и НЕМЕМА: игрок ещё не начал или отдыхает —
    // никаких «ударов», списывать нечего
    const atFloor = !correct && this.aden === 0;

    const aden = Math.max(0, this.aden + delta);
    const streak = correct ? this.stats.streak + 1 : 0;
    const stats: WallStats = {
      correct: this.stats.correct + (correct ? 1 : 0),
      wrong: this.stats.wrong + (correct ? 0 : 1),
      miss: this.stats.miss,
      streak,
      bestStreak: Math.max(this.stats.bestStreak, streak),
    };

    const level = levelForAden(aden);
    return new WallGame(
      'running', this.seed, this.index + 1, aden,
      Math.max(this.peakLevel, level), stats,
      at, correct ? 'correct' : (atFloor ? null : 'wrong'), correct ? mult : 0, cellIndex,
      buildWall(this.seed, this.index + 1, level),
    );
  }

  /** Тик: нижняя кромка стены КОСНУЛАСЬ линии сгорания = ПРОС, стена сгорает сразу (−1 аден; на нуле немо) */
  tick(at: number): WallGame {
    if (this.status !== 'running') return this;
    if (this.wall && this.wallDistance(at) > WALL_SPAN_HALF) return this;

    const aden = Math.max(0, this.aden - 1);
    const level = levelForAden(aden);
    const stats: WallStats = { ...this.stats, miss: this.stats.miss + 1, streak: 0 };
    return new WallGame(
      'running', this.seed, this.index + 1, aden, this.peakLevel, stats,
      at, this.aden === 0 ? null : 'miss', 0, null, buildWall(this.seed, this.index + 1, level),
    );
  }

  /** Единственный выход из забега; рекорд пика уже зафиксирован по ходу */
  surrender(): WallGame {
    if (this.status !== 'running') return this;
    return new WallGame(
      'idle', this.seed, this.index, this.aden, this.peakLevel, this.stats,
      this.wallSpawnedAt, this.lastResult, this.lastMult, this.lastCell, this.wall,
    );
  }

  // ─── сериализация ───

  toJSON(): WallGameJSON {
    return {
      status: this.status,
      seed: this.seed,
      index: this.index,
      aden: this.aden,
      peakLevel: this.peakLevel,
      stats: this.stats,
      wallSpawnedAt: this.wallSpawnedAt,
      lastResult: this.lastResult,
      lastMult: this.lastMult,
      lastCell: this.lastCell,
      problem: this.wall?.problem.toJSON() ?? null,
      cells: this.wall ? [...this.wall.cells] : [],
      correctCell: this.wall?.correctCell ?? -1,
      zoneCenter: this.wall?.zoneCenter ?? 0.5,
      zoneHalf: this.wall?.zoneHalf ?? ZONE_HALF_BASE,
    };
  }

  static fromJSON(data: WallGameJSON): WallGame {
    const problem = data.problem ? ProblemFactory.fromJSON(data.problem) : null;
    const wall: WallData | null = problem
      ? { problem, cells: data.cells, correctCell: data.correctCell, zoneCenter: data.zoneCenter, zoneHalf: data.zoneHalf }
      : null;
    return new WallGame(
      data.status, data.seed, data.index, data.aden, data.peakLevel,
      data.stats, data.wallSpawnedAt, data.lastResult, data.lastMult, data.lastCell, wall,
    );
  }
}
