import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StageScene } from '.';
import { Game } from '@/game/entities/Game';
import { Floor } from '@/game/entities/Floor';
import { Mordeo } from '@/game/entities/monsters/Mordeo';
import { Porta } from '@/game/entities/monsters/Porta';
import { sessionStore } from '@/stores/session';

const STATS = { correct: 0, wrong: 0, streak: 0, bestStreak: 0 };

function setGame(monsters: ConstructorParameters<typeof Floor>[2]): void {
  const game = new Game(
    'running',
    1,
    0,
    Game.start(1, 0).problem,
    Game.start(1, 0).player,
    STATS,
    new Floor(6, 'combat', monsters, { timeLimitMs: 20_000 }),
    0,
  );
  sessionStore.setState(() => ({ game }));
}

describe('StageScene — сцена с толпой монстров', () => {
  it('игрок один (дверь/сокровищница) — по центру, без монстров', () => {
    setGame([]);
    render(<StageScene monsters={[]} />);
    expect(screen.getByText('ты, ур. 2')).toBeInTheDocument(); // этаж 6 → уровень 2
    expect(screen.queryByText('⚔')).not.toBeInTheDocument();
  });

  it('три моба по-геройски: одна фигура цели + число 3 над головой, дверь в цепях', () => {
    setGame([new Porta(1, 46), new Porta(1, 46), new Mordeo(2, 46)]);
    const { container } = render(
      <StageScene monsters={[new Porta(1, 46), new Porta(1, 46), new Mordeo(2, 46)]} />,
    );
    expect(screen.getAllByText('Porta')).toHaveLength(1);
    expect(screen.queryByText('Mordeo')).not.toBeInTheDocument();
    expect(screen.getByText('▼ цель')).toBeInTheDocument();
    // геройский стак: число мобов над головой
    expect(screen.getByLabelText('мобов в пачке: 3')).toHaveTextContent('3');
    // дверь + фигура игрока + ОДНА фигура монстра (не три)
    expect(container.querySelectorAll('svg')).toHaveLength(3);
    expect(container.querySelectorAll('g[stroke="#8c6d34"]')).toHaveLength(1); // цепи двери
  });

  it('12 мобов: всё та же одна фигура, число 12 — ряд не растёт', () => {
    setGame(Array.from({ length: 12 }, () => new Porta(1, 52)));
    const pack = Array.from({ length: 12 }, () => new Porta(1, 52));
    const { container } = render(<StageScene monsters={pack} />);
    expect(container.querySelectorAll('svg')).toHaveLength(3); // дверь + игрок + монстр
    expect(screen.getByLabelText('мобов в пачке: 12')).toHaveTextContent('12');
    expect(screen.getAllByText('Porta')).toHaveLength(1);
  });
});
