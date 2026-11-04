import { describe, expect, it } from 'vitest';
import { Game } from './Game';
import { reduce } from '../fsm';

describe('Game', () => {
  it('start запускает забег с первой задачей', () => {
    const game = Game.start(42, 'medium', 1000);
    expect(game.status).toBe('running');
    expect(game.problem).not.toBeNull();
    expect(game.seed).toBe(42);
    expect(game.startedAt).toBe(1000);
    expect(game.aden).toBe(0);
  });

  it('верный ответ: +1 адена и следующая задача, детерминированная по seed', () => {
    let game = Game.start(42, 'medium', 0);
    game = game.answer(game.problem!.answer, 5);

    expect(game.aden).toBe(1);
    expect(game.index).toBe(1);
    expect(game.stats.streak).toBe(1);
    expect(game.status).toBe('running');
    expect(game.problem).not.toBeNull();

    // replay тем же seed даёт ту же вторую задачу
    const replay = Game.start(42, 'medium', 0).answer(Game.start(42, 'medium', 0).problem!.answer, 5);
    expect(replay.problem).toEqual(game.problem);
  });

  it('неверный ответ завершает забег с endReason=wrong и оставляет задачу', () => {
    let game = Game.start(42, 'medium', 0);
    const answer = game.problem!.answer;
    game = game.answer(answer + 1, 9000);

    expect(game.status).toBe('gameover');
    expect(game.endReason).toBe('wrong');
    expect(game.stats.wrong).toBe(1);
    expect(game.endedAt).toBe(9000);
    expect(game.problem!.answer).toBe(answer);

    // ответы после конца игнорируются
    expect(game.answer(answer, 9999)).toBe(game);
  });

  it('surrender завершает забег как бегство: адена сохраняется, wrong не растёт', () => {
    let game = Game.start(42, 'medium', 0).answer(Game.start(42, 'medium', 0).problem!.answer, 1);
    game = game.surrender(5000);

    expect(game.status).toBe('gameover');
    expect(game.endReason).toBe('surrender');
    expect(game.aden).toBe(1);
    expect(game.stats.wrong).toBe(0);
    expect(game.endedAt).toBe(5000);

    // повторная сдача после конца игнорируется
    expect(game.surrender(6000)).toBe(game);
  });

  it('лучшая серия растёт', () => {
    let game = Game.start(7, 'medium', 0);
    for (let i = 0; i < 3; i++) {
      game = game.answer(game.problem!.answer, i);
    }
    expect(game.stats.bestStreak).toBe(3);
    expect(game.stats.correct).toBe(3);
  });

  it('toJSON/fromJSON — полный roundtrip через JSON.stringify', () => {
    let game = Game.start(42, 'medium', 0);
    game = game.answer(game.problem!.answer, 5);
    const restored = Game.fromJSON(JSON.parse(JSON.stringify(game)) as ReturnType<Game['toJSON']>);
    expect(restored).toEqual(game);
    // и забег продолжается одинаково
    expect(restored.answer(12345, 6)).toEqual(game.answer(12345, 6));
  });

  it('reduce-адаптер переводит экшены в методы Game', () => {
    const idle = Game.idle('hard');
    const running = reduce(idle, { type: 'RUN/START', seed: 42, at: 0 }, 'hard');
    expect(running.status).toBe('running');

    const answered = reduce(running, { type: 'PROBLEM/ANSWER', value: running.problem!.answer, at: 1 }, 'hard');
    expect(answered.aden).toBe(1);

    const fled = reduce(answered, { type: 'RUN/SURRENDER', at: 2 }, 'hard');
    expect(fled.endReason).toBe('surrender');

    expect(reduce(fled, { type: 'SESSION/RESET' }, 'hard').status).toBe('idle');
  });
});
