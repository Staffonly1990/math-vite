import { describe, expect, it } from 'vitest';
import { WallGame, LAVA_START_MS, LAVA_PER_CORRECT_MS, BASE_APPROACH_MS } from './WallGame';

type G = InstanceType<typeof WallGame>;

describe('WallGame — стены', () => {
  it('start: бегущая игра с первой стеной', () => {
    const g = WallGame.start(42, 0);
    expect(g.status).toBe('running');
    expect(g.index).toBe(0);
    expect(g.level).toBe(1);
    expect(g.speedMultiplier).toBe(1);
    expect(g.lavaReserveMs).toBe(LAVA_START_MS);
    expect(g.wall).not.toBeNull();
    expect(g.wall!.cells).toHaveLength(4);
    expect(g.wall!.cells).toContain(g.wall!.problem.answer);
  });

  it('верный тап: адена+, скорость+, следующая стена, лава+', () => {
    const g = WallGame.start(42, 0);
    const correctCell = g.wall!.correctCell;
    const next = g.tapCell(correctCell, 100);

    expect(next.status).toBe('running');
    expect(next.index).toBe(1);
    expect(next.aden).toBe(1);
    expect(next.stats.correct).toBe(1);
    expect(next.stats.streak).toBe(1);
    expect(next.speedMultiplier).toBeGreaterThan(1);
    expect(next.lavaReserveMs).toBe(LAVA_START_MS + LAVA_PER_CORRECT_MS);
    expect(next.wall).not.toBeNull();
    expect(next.wall).not.toEqual(g.wall);
  });

  it('неверный тап: HP−, скорость=1, лава−', () => {
    const g = WallGame.start(42, 0);
    const wrongCell = (g.wall!.correctCell + 1) % 4;
    const next = g.tapCell(wrongCell, 100);

    expect(next.status).toBe('running');
    expect(next.player.hp).toBeLessThan(3);
    expect(next.speedMultiplier).toBe(1);
    expect(next.stats.wrong).toBe(1);
    expect(next.lavaReserveMs).toBeLessThan(LAVA_START_MS);
  });

  it('3 неверных тапа = gameover wrong', () => {
    let g: G = WallGame.start(42, 0);
    for (let i = 0; i < 3; i++) {
      const wrongCell = (g.wall!.correctCell + 1) % 4;
      g = g.tapCell(wrongCell, 100 + i);
    }
    expect(g.status).toBe('gameover');
    expect(g.endReason).toBe('wrong');
  });

  it('tick: лава тает, таймаут стены = авто-промах', () => {
    const g = WallGame.start(42, 0);
    // прошло больше времени чем подход стены
    const timeout = g.tick(BASE_APPROACH_MS + 100);
    expect(timeout.stats.wrong).toBe(1);
    expect(timeout.speedMultiplier).toBe(1);
    expect(timeout.index).toBe(1);
    expect(timeout.status).toBe('running');
  });

  it('tick: лава кончилась = gameover lava', () => {
    const g = WallGame.start(42, 0);
    const dead = g.tick(60_000);
    expect(dead.status).toBe('gameover');
    expect(dead.endReason).toBe('lava');
  });

  it('уровень растёт каждые 5 верных', () => {
    let g: G = WallGame.start(42, 0);
    for (let i = 0; i < 5; i++) {
      g = g.tapCell(g.wall!.correctCell, 100 + i);
    }
    expect(g.level).toBe(2);
    expect(g.aden).toBe(5); // 5 стен по уровню 1 (адена = уровню ДО тапа)
  });

  it('яд: ядовитая ячейка бьёт сильнее и травит', () => {
    // ищем seed с ядовитой ячейкой
    let g: G = WallGame.start(42, 0);
    let seed = 42;
    while (g.wall?.poisonCell === null && seed < 200) {
      seed++;
      g = WallGame.start(seed, 0);
    }
    if (g.wall?.poisonCell !== null) {
      const hpBefore = g.player.hp;
      const next = g.tapCell(g.wall!.poisonCell, 100);
      expect(next.player.hp).toBeLessThan(hpBefore);
      expect(next.player.poison).not.toBeNull();
    }
  });

  it('surrender: gameover, адена сохраняется', () => {
    let g: G = WallGame.start(42, 0);
    g = g.tapCell(g.wall!.correctCell, 100);
    const fled = g.surrender(200);
    expect(fled.status).toBe('gameover');
    expect(fled.endReason).toBe('surrender');
    expect(fled.aden).toBe(1);
  });

  it('toJSON/fromJSON: полный roundtrip', () => {
    let g: G = WallGame.start(42, 0);
    g = g.tapCell(g.wall!.correctCell, 100);
    const json = JSON.parse(JSON.stringify(g.toJSON()));
    const restored = WallGame.fromJSON(json);
    expect(restored.status).toBe(g.status);
    expect(restored.aden).toBe(g.aden);
    expect(restored.speedMultiplier).toBe(g.speedMultiplier);
    expect(restored.wall?.cells).toEqual(g.wall?.cells);
  });

  it('детерминизм: одинаковый seed = одинаковые стены', () => {
    const a = WallGame.start(77, 0);
    const b = WallGame.start(77, 0);
    expect(a.wall?.cells).toEqual(b.wall?.cells);
    expect(a.wall?.correctCell).toBe(b.wall?.correctCell);
    expect(a.wall?.problem.prompt).toBe(b.wall?.problem.prompt);
  });

  it('геометрия: стена приближается со временем', () => {
    const g = WallGame.start(42, 0);
    const d1 = g.wallDistance(500);
    const d2 = g.wallDistance(2000);
    expect(d1).toBeGreaterThan(d2);
    expect(d1).toBeLessThanOrEqual(1);
    expect(d2).toBeGreaterThan(0);
  });
});
