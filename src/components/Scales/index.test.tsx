import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Scales } from '.';
import { Game } from '@/game/entities/Game';
import { Floor } from '@/game/entities/Floor';
import { Porta } from '@/game/entities/monsters/Porta';
import { Player } from '@/game/entities/Player';
import { sessionStore } from '@/stores/session';

const STATS = { correct: 0, wrong: 0, streak: 0, bestStreak: 0 };

function setCombatGame(poisonStacks: number): void {
  const game = new Game(
    'running',
    1,
    0,
    Game.start(1, 0).problem,
    new Player(0, 3, 3, 0, poisonStacks > 0 ? { stacks: poisonStacks, remainingFloors: 2 } : null),
    STATS,
    new Floor(3, 'combat', [new Porta(1, 43)], { timeLimitMs: 20_000 }),
    0,
  );
  sessionStore.setState(() => ({ game }));
}

describe('Scales — яд на локальной шкале', () => {
  it('яд отображается зелёной полосой в начале шкалы, а не бейджем в статусе', () => {
    setCombatGame(4);
    const { container } = render(<Scales />);
    const poison = screen.getByLabelText('яд');
    expect(poison).toBeInTheDocument();
    // 4с яда на 20с шкале = 20% ширины
    expect(poison.style.width).toBe('20%');
    // бейджа ☠ в строке статуса больше нет
    expect(container.textContent).not.toContain('☠');
  });

  it('без яда зелёной полосы нет; яд больше шкалы занимает её целиком', () => {
    setCombatGame(0);
    const { rerender } = render(<Scales />);
    expect(screen.queryByLabelText('яд')).not.toBeInTheDocument();

    setCombatGame(99);
    rerender(<Scales />);
    const poison = screen.getByLabelText('яд');
    expect(poison.style.width).toBe('100%'); // кап по локальному времени
  });
});
