import { Store } from '@tanstack/store';
import { Game } from '@/game/entities/Game';
import { reduce } from '@/game/fsm';
import type { SessionAction } from '@/game/fsm';
import { newSeed } from '@/lib/random';
import { settingsStore } from './settings';

/** В стейте — экземпляр класса Game (результат работы классов ядра) */
export const sessionStore = new Store<{ game: Game }>({ game: Game.idle() });

export function dispatch(action: SessionAction): void {
  sessionStore.setState((s) => ({
    game: reduce(s.game, action, settingsStore.state.difficulty),
  }));
}

/** Старт нового забега: seed и отметка времени берутся здесь — ядро остаётся чистым */
export function startRun(): void {
  dispatch({ type: 'RUN/START', seed: newSeed(), at: Date.now() });
}
