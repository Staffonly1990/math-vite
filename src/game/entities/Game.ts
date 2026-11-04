import type { DifficultyId } from '../difficulty';
import { Rng } from '../rng';
import { ProblemFactory } from '../problem/ProblemFactory';
import type { Problem } from '../problem/Problem';
import type { ProblemJSON } from '../problem/Problem';
import type { ProblemSpec } from '../problem/ProblemGenerator';
import { Player } from './Player';
import type { PlayerJSON } from './Player';
import { Floor } from './Floor';
import type { FloorJSON } from './Floor';

export type SessionStatus = 'idle' | 'running' | 'gameover';

/** Чем закончился забег: ошибкой или бегством (SOE). */
export type EndReason = 'wrong' | 'surrender';

export interface SessionStats {
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
}

export interface GameJSON {
  status: SessionStatus;
  spec: ProblemSpec;
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
}

const EMPTY_STATS: SessionStats = { correct: 0, wrong: 0, streak: 0, bestStreak: 0 };

/**
 * Оркестратор забега: держит игрока, этаж (с фазы башни) и текущую задачу.
 * Все переходы — методами класса; методы не мутируют, а возвращают новый Game
 * (предсказуемость + корректная работа стора на селекторах).
 * Время и rng — только параметрами: класс остаётся детерминированным.
 */
export class Game {
  constructor(
    readonly status: SessionStatus,
    readonly spec: ProblemSpec,
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
  ) {}

  static idle(difficulty: DifficultyId = 'easy'): Game {
    return new Game('idle', { topic: 'arithmetic', difficulty }, 0, 0, null, new Player(), EMPTY_STATS);
  }

  static start(seed: number, difficulty: DifficultyId, at: number): Game {
    const spec: ProblemSpec = { topic: 'arithmetic', difficulty };
    return new Game('running', spec, seed, 0, ProblemFactory.create(new Rng(seed, 0), spec), new Player(), EMPTY_STATS, null, at);
  }

  /** Удобные геттеры для селекторов UI */
  get aden(): number {
    return this.player.aden;
  }

  answer(value: number, at: number): Game {
    if (this.status !== 'running' || !this.problem) return this;

    if (this.problem.isCorrect(value)) {
      const index = this.index + 1;
      const streak = this.stats.streak + 1;
      return new Game(
        'running',
        this.spec,
        this.seed,
        index,
        ProblemFactory.create(new Rng(this.seed, index), this.spec),
        this.player.awardAden(),
        { ...this.stats, correct: this.stats.correct + 1, streak, bestStreak: Math.max(this.stats.bestStreak, streak) },
        this.floor,
        this.startedAt,
        null,
        'correct',
        null,
      );
    }

    return new Game(
      'gameover',
      this.spec,
      this.seed,
      this.index,
      this.problem, // задача остаётся, чтобы показать верный ответ
      this.player,
      { ...this.stats, wrong: this.stats.wrong + 1, streak: 0 },
      this.floor,
      this.startedAt,
      at,
      'wrong',
      'wrong',
    );
  }

  surrender(at: number): Game {
    if (this.status !== 'running') return this;
    return new Game(
      'gameover',
      this.spec,
      this.seed,
      this.index,
      this.problem,
      this.player,
      { ...this.stats, streak: 0 },
      this.floor,
      this.startedAt,
      at,
      null,
      'surrender',
    );
  }

  toJSON(): GameJSON {
    return {
      status: this.status,
      spec: this.spec,
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
    };
  }

  static fromJSON(data: GameJSON): Game {
    return new Game(
      data.status,
      data.spec,
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
    );
  }
}
