import { describe, expect, it } from 'vitest';
import { Game, LAVA_MAX_MS, LAVA_PER_FLOOR_MS, LAVA_START_MS } from './Game';
import { Level } from './Level';
import { Floor } from './Floor';
import { FloorFactory } from './FloorFactory';
import { Mordeo } from './monsters/Mordeo';
import { Porta } from './monsters/Porta';
import { Player } from './Player';
import { Antidote } from './items/Antidote';
import { FreezeCore } from './items/FreezeCore';
import { HealPotion } from './items/HealPotion';
import { ShieldPlate } from './items/ShieldPlate';
import { reduce } from '../fsm';

const climbToFloor = (seed: number, floorNumber: number): Game => {
  let game = Game.start(seed, 0);
  while (game.floorNumber < floorNumber) {
    game =
      game.floor?.kind === 'treasure'
        ? game.skipChests(game.floorNumber * 100) // с сокровищницы — пропуском
        : game.answer(game.problem!.answer, game.floorNumber * 100); // двери/бои — примерами
  }
  return game;
};

describe('Game — раскладка башни', () => {
  it('этаж 1 — дверь, 3 — бой, 5 — сокровищница', () => {
    expect(Game.start(42, 0).floor!.kind).toBe('challenge');
    expect(climbToFloor(42, 3).floor!.kind).toBe('combat');
    expect(climbToFloor(42, 4).floor!.kind).toBe('challenge');
    expect(climbToFloor(42, 5).floor!.kind).toBe('treasure');
    expect(climbToFloor(42, 6).floor!.kind).toBe('combat');
    expect(climbToFloor(42, 10).floor!.kind).toBe('treasure');
  });

  it('на боевом этаже есть монстры по бюджету уровня', () => {
    const game = climbToFloor(42, 3);
    expect(game.floor!.monsters.length).toBeGreaterThan(0);
    expect(game.floor!.monsters.reduce((sum, m) => sum + m.rank, 0)).toBe(game.level.monsterBudget);
    expect(game.activeMonster).not.toBeNull();
  });
});

describe('Game — лава', () => {
  it('стартовый запас 10с, тик вычитает wall-clock время', () => {
    const game = Game.start(42, 0);
    expect(game.lavaReserveMs).toBe(LAVA_START_MS);

    const after2s = game.tick(2_000);
    expect(after2s.lavaReserveMs).toBe(8_000);
    const after5s = after2s.tick(5_000);
    expect(after5s.lavaReserveMs).toBe(5_000);
  });

  it('свёрнутая вкладка догоняется одним вычетом (без пауз)', () => {
    const game = Game.start(42, 0);
    const caught = game.tick(60_000); // час невидимости — один тик
    expect(caught.status).toBe('gameover');
    expect(caught.endReason).toBe('lava');
    expect(caught.tick(61_000)).toBe(caught); // мёртвых не тикают
  });

  it('новый этаж пополняет лаву с капом 30с', () => {
    let game = climbToFloor(42, 3); // прошли 2 двери: 10 + 5 + 5 = 20с без тиков
    expect(game.lavaReserveMs).toBe(LAVA_START_MS + LAVA_PER_FLOOR_MS * 2);
    expect(game.lavaReserveMs).toBeLessThanOrEqual(LAVA_MAX_MS);

    // искусственно подъём при почти полном запасе — кап (дверной этаж)
    const doors = climbToFloor(42, 2);
    const rich = new Game('running', 1, 0, doors.problem, new Player(0, 3, 3), doors.stats, doors.floor, 0, null, null, null, LAVA_MAX_MS - 1_000, 0);
    const advanced = rich.answer(rich.problem!.answer, 1);
    expect(advanced.lavaReserveMs).toBe(LAVA_MAX_MS);
  });
});

describe('Game — бой', () => {
  it('верный ответ бьёт монстра, зачистка этажа поднимает выше', () => {
    const game = climbToFloor(42, 3); // бой, монстры уровня 1 (hp = ранг)
    const monster = game.activeMonster!;
    const hpBefore = monster.hp;

    let fight = game.answer(game.problem!.answer, 1_000);
    const wounded = fight.floor!.monsters.find((m) => m.name === monster.name)!;
    expect(wounded.hp).toBe(hpBefore - 1);

    // добиваем всех: после зачистки этаж НЕ покидается — фаза двери
    let guard = 0;
    while (fight.activeMonster && guard++ < 20) {
      fight = fight.answer(fight.problem!.answer, 2_000 + guard);
    }
    expect(fight.floorNumber).toBe(3); // всё ещё на боевом этаже
    expect(fight.problem).not.toBeNull(); // ждёт пример-дверь
    expect(fight.answerTimeLimitMs).toBe(0); // таймер в фазе двери не тикает

    // решаем дверь — теперь вверх
    const climbed = fight.answer(fight.problem!.answer, 9_000);
    expect(climbed.floorNumber).toBe(4);
    expect(climbed.floor!.kind).toBe('challenge');
    expect(climbed.status).toBe('running');

    // ошибка на двери фатальна даже после зачистки
    const doomed = climbed.answer(climbed.problem!.answer + 999, 9_500);
    expect(doomed.status).toBe('gameover');
    expect(doomed.endReason).toBe('wrong');
  });

  it('неверный ответ — удар монстра по игроку, не смерть; HP=0 → gameover hp', () => {
    const game = climbToFloor(42, 3);
    const strength = game.activeMonster!.strength;

    const hurt = game.answer(game.problem!.answer + 1_000, 1_000);
    expect(hurt.status).toBe('running');
    expect(hurt.player.hp).toBe(3 - strength);
    expect(hurt.problem).not.toBe(game.problem); // новый пример

    // добиваем игрока неверными ответами
    let dying = hurt;
    let guard = 0;
    while (dying.status === 'running' && guard++ < 20) {
      dying = dying.answer(dying.problem!.answer + 1_000, 2_000 + guard);
    }
    expect(dying.status).toBe('gameover');
    expect(dying.endReason).toBe('hp');
  });

  it('таймаут — удар монстра; ядро игнорирует преждевременный/замороженный', () => {
    const game = climbToFloor(42, 3);
    const limit = game.answerTimeLimitMs;

    const premature = game.floorTimeout(100); // времени мало прошло
    expect(premature).toBe(game);

    const timedOut = game.floorTimeout(10_000 + limit + 1);
    expect(timedOut.player.hp).toBe(3 - game.activeMonster!.strength);

    const frozen = game.useItem(0, 0); // нет предмета — ничего
    expect(frozen).toBe(game);
  });

  it('локальный таймер — только когда монстры: на дверях его нет', () => {
    const first = Game.start(42, 0);
    expect(first.floor!.kind).toBe('challenge');
    expect(first.answerTimeLimitMs).toBe(0); // на двери таймера нет
    expect(first.floorTimeout(60_000)).toBe(first); // таймаут на двери — пустой звук

    const combatFloor = climbToFloor(42, 3);
    expect(combatFloor.answerTimeLimitMs).toBeGreaterThan(0);
  });

  it('яд: Mordeo травит при касании HP, Porta — нет; щит глотает удар без яда', () => {
    const mordeoFloor = new Floor(3, 'combat', [new Mordeo(2, 43)], { timeLimitMs: 20_000 });
    const mordeoGame = new Game('running', 1, 0, Game.start(1, 0).problem, new Player(), { correct: 0, wrong: 0, streak: 0, bestStreak: 0 }, mordeoFloor, 0, null, null, null, LAVA_START_MS, 0, 0, 0, 0);

    const poisoned = mordeoGame.answer(mordeoGame.problem!.answer + 999, 1_000);
    expect(poisoned.player.hp).toBe(1); // сила Mordeo = 2
    expect(poisoned.player.poison?.stacks).toBe(1);
    expect(poisoned.answerTimeLimitMs).toBe(20_000 - 1_000); // яд срезает локальное время

    // яд не может съесть больше локального времени: шкала не уходит в минус
    const megaPoisonGame = new Game('running', 1, 0, Game.start(1, 0).problem, new Player(0, 3, 3, 0, { stacks: 99, remainingFloors: 2 }), { correct: 0, wrong: 0, streak: 0, bestStreak: 0 }, mordeoFloor, 0, null, null, null, LAVA_START_MS, 0, 0, 0, 0);
    expect(megaPoisonGame.answerTimeLimitMs).toBe(0);

    // второй удар ядом — добивает: 1 HP − 2 урона = смерть
    const stacked = poisoned.answer(poisoned.problem!.answer + 999, 2_000);
    expect(stacked.status).toBe('gameover');
    expect(stacked.endReason).toBe('hp');

    // щит полностью глотает удар Mordeo — яда нет
    const shielded = new Game('running', 1, 0, Game.start(1, 0).problem, new Player(0, 3, 3, 2), { correct: 0, wrong: 0, streak: 0, bestStreak: 0 }, mordeoFloor, 0, null, null, null, LAVA_START_MS, 0, 0, 0, 0);
    const blocked = shielded.answer(shielded.problem!.answer + 999, 1_000);
    expect(blocked.player.shield).toBe(0);
    expect(blocked.player.hp).toBe(3);
    expect(blocked.player.poison).toBeNull();

    // Porta не травит вовсе
    const portaFloor = new Floor(3, 'combat', [new Porta(1, 43)], { timeLimitMs: 20_000 });
    const portaGame = new Game('running', 1, 0, Game.start(1, 0).problem, new Player(), { correct: 0, wrong: 0, streak: 0, bestStreak: 0 }, portaFloor, 0, null, null, null, LAVA_START_MS, 0, 0, 0, 0);
    const bitten = portaGame.answer(portaGame.problem!.answer + 999, 1_000);
    expect(bitten.player.hp).toBe(2);
    expect(bitten.player.poison).toBeNull();
  });

  it('яд выдыхается через 3 этажа и обновляется новым ударом', () => {
    const poisoned = new Player(0, 3, 3, 0, { stacks: 1, remainingFloors: 1 });
    expect(poisoned.tickPoisonFloor().poison).toBeNull();

    const fresh = new Player(0, 3, 3, 0, { stacks: 5, remainingFloors: 3 });
    expect(fresh.applyPoison().poison).toEqual({ stacks: 6, remainingFloors: 3 });
  });
});

describe('Game — предметы', () => {
  const withItems = (items: readonly (HealPotion | Antidote | ShieldPlate | FreezeCore)[] = []) =>
    new Game(
      'running',
      1,
      0,
      Game.start(1, 0).problem,
      new Player(0, 1, 3, 0, { stacks: 2, remainingFloors: 2 }),
      { correct: 0, wrong: 0, streak: 0, bestStreak: 0 },
      FloorFactory.challenge(1),
      0,
      null,
      null,
      null,
      LAVA_START_MS,
      0,
      0,
      0,
      0,
      items,
    );

  it('лечение восполняет всё, антидот снимает весь яд, пластина даёт щит', () => {
    expect(withItems([new HealPotion()]).useItem(0, 1).player.hp).toBe(3);
    expect(withItems([new Antidote()]).useItem(0, 1).player.poison).toBeNull();
    expect(withItems([new ShieldPlate()]).useItem(0, 1).player.shield).toBe(1);
    expect(withItems([]).useItem(0, 1).items.length).toBe(0); // пустой инвентарь — ничего
  });

  it('ядро заморозки замораживает лаву и таймер ответа', () => {
    const frozen = withItems([new FreezeCore()]).useItem(0, 1_000);
    expect(frozen.frozenUntilMs).toBe(6_000);

    const ticked = frozen.tick(2_000);
    expect(ticked.lavaReserveMs).toBe(LAVA_START_MS); // лава стоит
    expect(ticked.frozenAccumMs).toBe(1_000); // замороженное время копится

    const afterFreeze = ticked.tick(7_000);
    expect(afterFreeze.lavaReserveMs).toBeLessThan(LAVA_START_MS); // снова тикает
  });
});

describe('Game — сундуки', () => {
  it('один сундук — и сразу наверх; больше открыть нельзя', () => {
    const game = climbToFloor(42, 5);
    expect(game.floor!.kind).toBe('treasure');

    const chestCount = game.chestsOpened.length;
    const itemChest = game.chestsOpened.findIndex((_, i) => {
      const probe = game.openChest(i, 1_000);
      return probe.floorNumber === 6 && probe.items.length > game.items.length;
    });
    if (chestCount > 0 && itemChest >= 0) {
      const picked = game.openChest(itemChest, 2_000);
      expect(picked.floorNumber).toBe(6); // выбор = немедленный подъём
      expect(picked.status).toBe('running');
      // повторное открытие на новом этаже невозможно — мы уже не на сокровищнице
      expect(picked.openChest(0, 3_000)).toBe(picked);
    }
  });

  it('«Пропустить» уводит наверх без сундуков', () => {
    const game = climbToFloor(42, 5);
    const skipped = game.skipChests(1_000);
    expect(skipped.floorNumber).toBe(6);
    expect(skipped.floor!.kind).toBe('combat');
    expect(skipped.chestsOpened.every((o) => !o)).toBe(true);
    expect(skipped.status).toBe('running');
  });

  it('ловушка-сундук бьёт, травит — и всё равно уводит наверх', () => {
    // подбираем seed, где первый сундук на 5 этаже — ловушка
    let seed = 0;
    let game = climbToFloor(seed, 5);
    let first: ReturnType<typeof game.openChest> = game;
    while (seed < 500) {
      game = climbToFloor(seed, 5);
      const hpBefore = game.player.hp;
      first = game.openChest(0, 1);
      if (first.player.hp < hpBefore) break; // удар прошёл — ловушка
      seed++;
    }
    expect(first.player.hp).toBe(2);
    expect(first.player.poison?.stacks).toBe(1);
    expect(first.floorNumber).toBe(6); // после ловушки — сразу следующий этаж
    expect(first.status).toBe('running');
  });
});

describe('Game — сериализация и FSM', () => {
  it('toJSON/fromJSON — полный roundtrip через JSON.stringify', () => {
    let game = climbToFloor(42, 3);
    game = game.answer(game.problem!.answer, 5);
    const restored = Game.fromJSON(JSON.parse(JSON.stringify(game.toJSON())) as ReturnType<Game['toJSON']>);
    expect(restored).toEqual(game);
    expect(restored.floorNumber).toBe(3);
    expect(restored.level).toEqual(new Level(1));
  });

  it('reduce-адаптер переводит все экшены', () => {
    const running = reduce(Game.idle(), { type: 'RUN/START', seed: 42, at: 0 });
    const answered = reduce(running, { type: 'PROBLEM/ANSWER', value: running.problem!.answer, at: 1 });
    expect(answered.floorNumber).toBe(2);
    expect(reduce(answered, { type: 'RUN/TICK', at: 3_000 }).lavaReserveMs).toBeGreaterThan(0);
    expect(reduce(answered, { type: 'RUN/SURRENDER', at: 4 }).endReason).toBe('surrender');
    expect(reduce(Game.idle(), { type: 'SESSION/RESET' }).status).toBe('idle');
  });
});
