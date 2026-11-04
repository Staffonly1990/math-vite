import { describe, expect, it } from 'vitest';
import { Rng } from '../rng';
import { Floor } from './Floor';
import { FloorFactory } from './FloorFactory';
import { Game } from './Game';
import { Level } from './Level';
import { FLOORS_PER_LEVEL } from './Level';
import { Monster } from './monsters/Monster';
import { MonsterFactory } from './monsters/MonsterFactory';
import { Mordeo } from './monsters/Mordeo';
import { Porta } from './monsters/Porta';
import { Player } from './Player';

describe('Porta (обычный, ранг 1)', () => {
  it('без способностей, удары без мутаций', () => {
    const porta = new Porta(1, 41);
    expect(porta.name).toBe('Porta');
    expect(porta.rank).toBe(1);
    expect(porta.hp).toBe(1);

    const dead = porta.takeHit();
    expect(dead).toBeInstanceOf(Porta);
    expect(dead.isDead).toBe(true);
    expect(porta.hp).toBe(1); // оригинал не тронут
  });

  it('roundtrip toJSON/fromJSON', () => {
    const porta = new Porta(2, 45);
    const restored = MonsterFactory.fromJSON(JSON.parse(JSON.stringify(porta.toJSON())));
    expect(restored).toEqual(porta);
    expect(restored).toBeInstanceOf(Porta);
  });
});

describe('Mordeo (ядовитый, ранг 2)', () => {
  it('ядовит, силён вдвое, удары не меняют суть', () => {
    const mordeo = new Mordeo(4, 42);
    expect(mordeo.name).toBe('Mordeo');
    expect(mordeo.rank).toBe(2);
    expect(mordeo.poisonous).toBe(true);
    expect(mordeo.strength).toBe(2);

    const hurt = mordeo.takeHit(2);
    expect(hurt.hp).toBe(2);
    expect(hurt.poisonous).toBe(true);
  });

  it('roundtrip toJSON/fromJSON', () => {
    const mordeo = new Mordeo(4, 50);
    const restored = MonsterFactory.fromJSON(JSON.parse(JSON.stringify(mordeo.toJSON())));
    expect(restored).toEqual(mordeo);
    expect((restored as Mordeo).poisonous).toBe(true);
  });
});

describe('Level — уровень сложности (не этаж!)', () => {
  it('бюджет монстров и ранги растут с уровнем', () => {
    expect(Level.first().monsterBudget).toBe(2);
    expect(new Level(2).monsterBudget).toBe(3);
    expect(new Level(3).monsterBudget).toBe(4);

    expect(Level.first().maxRank).toBe(1); // на 1-м уровне только ранг 1
    expect(new Level(2).maxRank).toBe(2); // Mordeo открывается со 2-го
    expect(new Level(9).maxRank).toBe(2); // пока максимум среди классов
  });

  it('уровень вычисляется из этажа: каждые FLOORS_PER_LEVEL этажей — новый', () => {
    expect(Level.forFloor(1).number).toBe(1);
    expect(Level.forFloor(3).number).toBe(1);
    expect(Level.forFloor(4).number).toBe(2);
    expect(Level.forFloor(10).number).toBe(4);
    expect(FLOORS_PER_LEVEL).toBe(3);
  });

  it('next() и roundtrip', () => {
    expect(Level.first().next().number).toBe(2);
    const level = new Level(5);
    expect(Level.fromJSON(JSON.parse(JSON.stringify(level.toJSON())))).toEqual(level);
  });
});

describe('MonsterFactory — состав этажа по бюджету', () => {
  it('сумма рангов монстров всегда равна бюджету уровня', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const levelNumber of [1, 2, 3, 5, 8]) {
        const level = new Level(levelNumber);
        const monsters = MonsterFactory.composeForLevel(level, 4, new Rng(seed, levelNumber));
        expect(monsters.reduce((sum, monster) => sum + monster.rank, 0)).toBe(level.monsterBudget);
        expect(monsters.length).toBeGreaterThan(0);
      }
    }
  });

  it('на уровне 1 — только Porta (ранг 1), на уровне 2+ встречается и Mordeo', () => {
    const first = MonsterFactory.composeForLevel(Level.first(), 1, new Rng(0));
    expect(first.every((monster) => monster instanceof Porta)).toBe(true);

    let seenMordeo = false;
    let seenAllPorta = false;
    for (let seed = 0; seed < 200 && !(seenMordeo && seenAllPorta); seed++) {
      const monsters = MonsterFactory.composeForLevel(new Level(2), 4, new Rng(seed));
      if (monsters.some((monster) => monster instanceof Mordeo)) seenMordeo = true;
      if (monsters.every((monster) => monster instanceof Porta)) seenAllPorta = true;
    }
    // бюджет 3 раскладывается и как 1+1+1 (только Porta), и как 2+1 (Mordeo + Porta)
    expect(seenMordeo).toBe(true);
    expect(seenAllPorta).toBe(true);
  });

  it('hp = ранг × уровень сложности, уровень монстра = 40 + этаж', () => {
    const monsters = MonsterFactory.composeForLevel(new Level(3), 7, new Rng(1));
    for (const monster of monsters) {
      expect(monster.hp).toBe(monster.rank * 3);
      expect(monster.level).toBe(47);
    }
  });
});

describe('Floor — этаж-локация', () => {
  it('владеет монстрами; isCleared по всем монстрам', () => {
    const monsters: Monster[] = [new Porta(1, 41), new Mordeo(2, 42)];
    const floor = new Floor(1, 'combat', monsters);
    expect(floor.monsterCount).toBe(2);
    expect(floor.isCleared).toBe(false);

    const cleared = new Floor(1, 'combat', monsters.map((monster) => monster.takeHit(99)));
    expect(cleared.isCleared).toBe(true);
  });

  it('уровень сложности этажа вычисляется из номера', () => {
    expect(new Floor(1, 'challenge').level.number).toBe(1);
    expect(new Floor(4, 'challenge').level.number).toBe(2);
  });

  it('roundtrip toJSON/fromJSON с монстрами и параметрами', () => {
    const floor = FloorFactory.combat(5, new Rng(3));
    const restored = Floor.fromJSON(JSON.parse(JSON.stringify(floor.toJSON())));
    expect(restored).toEqual(floor);
  });
});

describe('FloorFactory', () => {
  const rng = new Rng(4);

  it('challenge — этаж без монстров', () => {
    const floor = FloorFactory.challenge(2);
    expect(floor.kind).toBe('challenge');
    expect(floor.monsterCount).toBe(0);
  });

  it('combat — монстры по бюджету, таймер сжимается с этажом и уровнем', () => {
    const low = FloorFactory.combat(1, rng);
    const high = FloorFactory.combat(13, rng); // уровень сложности 5
    expect(low.monsters.reduce((s, m) => s + m.rank, 0)).toBe(low.level.monsterBudget);
    expect(high.params.timeLimitMs!).toBeLessThan(low.params.timeLimitMs!);
  });

  it('treasure — сундуки без монстров', () => {
    const floor = FloorFactory.treasure(3);
    expect(floor.kind).toBe('treasure');
    expect(floor.params.chests).toBeGreaterThan(0);
    expect(floor.monsterCount).toBe(0);
  });
});

describe('Player — инвариант урона', () => {
  it('щит глотает удар целиком — HP цел, касания нет', () => {
    const shielded = new Player(0, 3, 3, 2);
    const { player, touchedHp } = shielded.takeHit(2);
    expect(touchedHp).toBe(false);
    expect(player.shield).toBe(0);
    expect(player.hp).toBe(3);
  });

  it('щит сломан с переполнением — остаток в HP, касание есть', () => {
    const shielded = new Player(0, 3, 3, 1);
    const { player, touchedHp } = shielded.takeHit(2);
    expect(touchedHp).toBe(true);
    expect(player.shield).toBe(0);
    expect(player.hp).toBe(2);
  });

  it('без щита — весь урон в HP', () => {
    const bare = new Player(0, 3, 3, 0);
    const { player, touchedHp } = bare.takeHit(2);
    expect(touchedHp).toBe(true);
    expect(player.hp).toBe(1);
    expect(bare.hp).toBe(3); // без мутаций
  });

  it('адена, лечение, пластина, антидот, выдох яда по этажам', () => {
    const rich = new Player().awardAden(5);
    expect(rich.aden).toBe(5);
    expect(new Player(0, 1, 3).heal('full').hp).toBe(3);
    expect(new Player().addShield(2).shield).toBe(2);
    expect(new Player(0, 3, 3, 0, { stacks: 4, remainingFloors: 2 }).clearPoison().poison).toBeNull();

    let poisoned = new Player().applyPoison().applyPoison();
    expect(poisoned.poison).toEqual({ stacks: 2, remainingFloors: 3 });
    poisoned = poisoned.tickPoisonFloor();
    expect(poisoned.poison?.remainingFloors).toBe(2);
    expect(poisoned.tickPoisonFloor().tickPoisonFloor().poison).toBeNull();
  });

  it('roundtrip toJSON/fromJSON с ядом и щитом', () => {
    const player = new Player(12, 3, 5, 2, { stacks: 1, remainingFloors: 2 });
    expect(Player.fromJSON(JSON.parse(JSON.stringify(player.toJSON())))).toEqual(player);
  });
});

describe('Game + Floor (задел фазы башни)', () => {
  it('забег стартует с первого этажа-двери', () => {
    const game = Game.start(42, 0);
    expect(game.floor).not.toBeNull();
    expect(game.floorNumber).toBe(1);
    expect(game.status).toBe('running');
  });
});
