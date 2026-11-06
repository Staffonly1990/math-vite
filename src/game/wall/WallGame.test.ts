import { describe, expect, it } from 'vitest';
import {
  WallGame,
  adenThreshold,
  levelForAden,
  lanesForLevel,
  mathLevelForLevel,
  speedForLevel,
  zoneHalfForLevel,
  zoneHit,
  BASE_APPROACH_MS,
} from './WallGame';

const T0 = 1_000;

/** ранний тап у горизонта — гарантированно вне зоны (центр ≤ 0.75 + 0.125) */
const EARLY = 200;

/** ответить верно n раз (каждую стену сразу после спавна + elapsed) */
function answerCorrect(g: WallGame, times: number, elapsed = EARLY): WallGame {
  let game = g;
  for (let i = 0; i < times; i++) {
    game = game.tapCell(game.wall!.correctCell, game.wallSpawnedAt + elapsed);
  }
  return game;
}

/** время тапа точно в центре зоны ×2 данной стены */
function inZoneElapsed(g: WallGame): number {
  return Math.round(BASE_APPROACH_MS * (1 - g.wall!.zoneCenter));
}

/** индекс первой неверной ячейки */
function wrongCellOf(g: WallGame): number {
  const wrong = g.wall!.cells.findIndex((_, i) => i !== g.wall!.correctCell);
  return wrong === -1 ? 0 : wrong;
}

describe('экономика: пороги и производные', () => {
  it('уровень = f(баланса): 0–5 → 0, 6–15 → 1, 16–25 → 2, 26 → 3', () => {
    expect(levelForAden(0)).toBe(0);
    expect(levelForAden(5)).toBe(0);
    expect(levelForAden(6)).toBe(1);
    expect(levelForAden(15)).toBe(1);
    expect(levelForAden(16)).toBe(2);
    expect(levelForAden(26)).toBe(3);
  });

  it('кумулятивные пороги 6, 16, 46', () => {
    expect(adenThreshold(1)).toBe(6);
    expect(adenThreshold(2)).toBe(16);
    expect(adenThreshold(5)).toBe(46);
  });

  it('полосы: ур.0 → 2, ур.1–2 → 3, ур.3+ → 4; математика «одна ось за раз»', () => {
    expect(lanesForLevel(0)).toBe(2);
    expect(lanesForLevel(1)).toBe(3);
    expect(lanesForLevel(2)).toBe(3);
    expect(lanesForLevel(3)).toBe(4);
    expect(lanesForLevel(9)).toBe(4);
    expect(mathLevelForLevel(0)).toBe(1);   // +(2)
    expect(mathLevelForLevel(1)).toBe(1);   // отдых по математике при +полосе
    expect(mathLevelForLevel(2)).toBe(2);   // +(3)
    expect(mathLevelForLevel(3)).toBe(2);   // отдых при +полосе
    expect(mathLevelForLevel(4)).toBe(3);   // +(4)
    expect(mathLevelForLevel(5)).toBe(4);   // −(2)
    expect(mathLevelForLevel(7)).toBe(6);   // −(4)
    expect(mathLevelForLevel(8)).toBe(7);   // двузначные ±(2)
    expect(mathLevelForLevel(10)).toBe(9);  // двузначные ±(4)
    expect(mathLevelForLevel(11)).toBe(10); // ×(2) таблица
    expect(mathLevelForLevel(12)).toBe(11); // ×(3)
    expect(mathLevelForLevel(13)).toBe(12); // ×(4)
    expect(mathLevelForLevel(14)).toBe(13); // ÷(2) таблица
    expect(mathLevelForLevel(16)).toBe(15); // ÷(4) микс — контент полон
    expect(mathLevelForLevel(17)).toBe(15); // отдых при скорости ×2
    expect(mathLevelForLevel(18)).toBe(16); // финальный микс
    expect(mathLevelForLevel(99)).toBe(16); // дальше не растёт
  });

  it('зона ×2: касание плитой отрезка, не центр — и СЖИМАЕТСЯ с уровнем', () => {
    // плита (±0.095) задевает отрезок (±zoneHalf)
    expect(zoneHit(0.5, 0.5, 0.045)).toBe(true);       // центр в центре
    expect(zoneHit(0.61, 0.5, 0.045)).toBe(true);      // край плиты касается края отрезка
    expect(zoneHit(0.15, 0.5, 0.045)).toBe(false);     // далеко
    // на высоких уровнях окно уже
    expect(zoneHit(0.55, 0.5, 0.045)).toBe(true);
    expect(zoneHalfForLevel(0)).toBeGreaterThan(zoneHalfForLevel(5));
    expect(zoneHalfForLevel(5)).toBeGreaterThan(zoneHalfForLevel(20));
    expect(zoneHalfForLevel(20)).toBeCloseTo(0.015);   // пол
  });

  it('скорость — только целые: ×1 до ур.17, ×2 до ур.21, дальше ×3', () => {
    expect(speedForLevel(0)).toBe(1);
    expect(speedForLevel(16)).toBe(1);
    expect(speedForLevel(17)).toBe(2);
    expect(speedForLevel(20)).toBe(2);
    expect(speedForLevel(21)).toBe(3);
    expect(speedForLevel(50)).toBe(3);
  });
});

describe('WallGame v2: старт и верные ответы', () => {
  it('старт: бегим, баланс 0, уровень 0, стена из 2 ячеек', () => {
    const g = WallGame.start(42, T0);
    expect(g.status).toBe('running');
    expect(g.aden).toBe(0);
    expect(g.level).toBe(0);
    expect(g.peakLevel).toBe(0);
    expect(g.wall?.cells).toHaveLength(2);
    expect(g.wall!.cells).toContain(g.wall!.problem.answer);
  });

  it('верный вне зоны = +1 аден', () => {
    const g = answerCorrect(WallGame.start(42, T0), 1);
    expect(g.aden).toBe(1);
    expect(g.lastResult).toBe('correct');
    expect(g.stats.streak).toBe(1);
  });

  it('золотая зона ×2 случайна на трассе: тап в центре зоны даёт +2', () => {
    const g0 = WallGame.start(42, T0);
    expect(g0.wall!.zoneCenter).toBeGreaterThanOrEqual(0.15);
    expect(g0.wall!.zoneCenter).toBeLessThanOrEqual(0.8);
    const g = g0.tapCell(g0.wall!.correctCell, T0 + inZoneElapsed(g0));
    expect(g.aden).toBe(2);
    expect(g.lastMult).toBe(2);
  });

  it('ранний тап у горизонта = ×1, у каждой стены своя зона', () => {
    const g = answerCorrect(WallGame.start(42, T0), 2);
    expect(g.aden).toBe(2);
    expect(g.lastMult).toBe(1);
    expect(g.wall!.zoneCenter).not.toBe(WallGame.start(42, T0).wall!.zoneCenter);
  });

  it('6 аденов = уровень 1: дорога стала 3 полосы, пик зафиксирован', () => {
    const g = answerCorrect(WallGame.start(42, T0), 6);
    expect(g.aden).toBe(6);
    expect(g.level).toBe(1);
    expect(g.peakLevel).toBe(1);
    expect(g.wall?.cells).toHaveLength(3);
    expect(g.speedMultiplier).toBe(1);
  });

  it('×2 перепрыгивает порог: с 5 аденов тап в зоне даёт 7 → уровень 1', () => {
    let g = answerCorrect(WallGame.start(42, T0), 5);
    expect(g.level).toBe(0);
    g = g.tapCell(g.wall!.correctCell, g.wallSpawnedAt + inZoneElapsed(g));
    expect(g.aden).toBe(7);
    expect(g.level).toBe(1);
  });
});

describe('WallGame v2: ошибки, просы, пол', () => {
  it('неверный тап = −1 аден', () => {
    const g0 = answerCorrect(WallGame.start(42, T0), 3);
    const g = g0.tapCell(wrongCellOf(g0), g0.wallSpawnedAt + EARLY);
    expect(g.aden).toBe(2);
    expect(g.lastResult).toBe('wrong');
    expect(g.stats.streak).toBe(0);
  });

  it('ошибка на нуле бесплатна и НЕМА: игрок не начал/отдыхает — никаких сигналов', () => {
    const g0 = WallGame.start(42, T0);
    const g = g0.tapCell(wrongCellOf(g0), T0 + EARLY);
    expect(g.aden).toBe(0);
    expect(g.status).toBe('running');
    expect(g.level).toBe(0);
    expect(g.lastResult).toBeNull(); // ни «удара», ни стрелок — тишина
  });

  it('прос: стена доехала = −1 аден, ран продолжается', () => {
    const g0 = answerCorrect(WallGame.start(42, T0), 3);
    const g = g0.tick(g0.wallSpawnedAt + BASE_APPROACH_MS + 1);
    expect(g.aden).toBe(2);
    expect(g.lastResult).toBe('miss');
    expect(g.stats.miss).toBe(1);
    expect(g.status).toBe('running');
  });

  it('сгорание по касанию кромкой: до касания тик нем, коснулась — сразу прос', () => {
    const g0 = answerCorrect(WallGame.start(42, T0), 3);
    // кромка ещё не дошла (d ≈ 0.15 > 0.08)
    const before = g0.tick(g0.wallSpawnedAt + BASE_APPROACH_MS * 0.85);
    expect(before).toBe(g0);
    // кромка коснулась линии (d ≈ 0.07 < 0.08)
    const burned = g0.tick(g0.wallSpawnedAt + BASE_APPROACH_MS * 0.93);
    expect(burned.lastResult).toBe('miss');
    expect(burned.aden).toBe(2);
  });

  it('прос на нуле = ничего не происходит, немо', () => {
    const g0 = WallGame.start(42, T0);
    const g = g0.tick(T0 + BASE_APPROACH_MS + 1);
    expect(g.aden).toBe(0);
    expect(g.level).toBe(0);
    expect(g.lastResult).toBeNull();
    expect(g.status).toBe('running');
  });

  it('верный на нуле стартует игру: сигнал есть', () => {
    const g = answerCorrect(WallGame.start(42, T0), 1);
    expect(g.lastResult).toBe('correct');
  });

  it('тик до прилёта стены ничего не меняет', () => {
    const g0 = WallGame.start(42, T0);
    const g = g0.tick(T0 + 500);
    expect(g).toBe(g0);
  });
});

describe('WallGame v2: падение уровня и пик', () => {
  it('баланс 16 (ур.2) → ошибка → 15 = ур.1; пик сохраняется', () => {
    let g = answerCorrect(WallGame.start(42, T0), 16);
    // если по пути попался бонус на верной ячейке — сбрасываем лишнее честными ошибками
    while (g.aden > 16) g = g.tapCell(wrongCellOf(g), g.wallSpawnedAt + EARLY);
    expect(g.aden).toBe(16);
    expect(g.level).toBe(2);
    g = g.tapCell(wrongCellOf(g), g.wallSpawnedAt + EARLY);
    expect(g.aden).toBe(15);
    expect(g.level).toBe(1);
    expect(g.peakLevel).toBe(2);
  });

  it('пик уровня переживает любые падения', () => {
    let g = answerCorrect(WallGame.start(42, T0), 26); // ур.3
    expect(g.peakLevel).toBe(3);
    for (let i = 0; i < 5; i++) {
      g = g.tapCell(wrongCellOf(g), g.wallSpawnedAt + EARLY);
    }
    expect(g.peakLevel).toBe(3);
    expect(g.level).toBeLessThan(3);
  });
});

describe('WallGame v2: прочее', () => {
  it('детерминизм: одинаковый сид = одинаковые стены', () => {
    const a = answerCorrect(WallGame.start(7, T0), 3);
    const b = answerCorrect(WallGame.start(7, T0), 3);
    expect(a.wall!.cells).toEqual(b.wall!.cells);
    expect(a.wall!.problem.prompt).toBe(b.wall!.problem.prompt);
  });

  it('сериализация туда-обратно', () => {
    const g = answerCorrect(WallGame.start(42, T0), 7);
    const restored = WallGame.fromJSON(g.toJSON());
    expect(restored.aden).toBe(g.aden);
    expect(restored.level).toBe(g.level);
    expect(restored.peakLevel).toBe(g.peakLevel);
    expect(restored.wall?.cells).toEqual(g.wall!.cells);
    expect(restored.wall?.problem.prompt).toBe(g.wall!.problem.prompt);
  });

  it('сдача завершает забег (idle), итоги не теряются; старт — заново', () => {
    const g0 = answerCorrect(WallGame.start(42, T0), 6);
    const g = g0.surrender();
    expect(g.status).toBe('idle');
    expect(g.aden).toBe(6);
    const next = WallGame.start(43, T0);
    expect(next.aden).toBe(0);
    expect(next.index).toBe(0);
  });

  it('скорость с уровнем: подлёт стен укорачивается', () => {
    const fast = answerCorrect(WallGame.start(42, T0), 36); // ур.3, полосы 4, темп ×1
    expect(fast.lanes).toBe(4);
    expect(fast.speedMultiplier).toBe(1);
    const turbo = answerCorrect(WallGame.start(42, T0), 166); // ур.17 → ×2
    expect(turbo.speedMultiplier).toBe(2);
    expect(BASE_APPROACH_MS / turbo.speedMultiplier).toBeLessThan(BASE_APPROACH_MS);
  });

  it('peekNext: детерминированное превью следующей стены с полосами текущего уровня', () => {
    const g0 = WallGame.start(42, T0);
    const next = g0.peekNext();
    expect(next).not.toBeNull();
    expect(next!.cells).toHaveLength(g0.wall!.cells.length);
    // та же стена придёт после ответа (уровень не сменился)
    const answered = g0.tapCell(g0.wall!.correctCell, T0 + 200);
    expect(answered.wall!.cells).toEqual(next!.cells);
    expect(WallGame.idle().peekNext()).toBeNull();
  });
});
