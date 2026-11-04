import type { DifficultyId } from './difficulty';
import type { Game } from './entities/Game';
import { Game as GameClass } from './entities/Game';

export type SessionAction =
  | { type: 'RUN/START'; seed: number; at: number }
  | { type: 'PROBLEM/ANSWER'; value: number; at: number }
  | { type: 'RUN/SURRENDER'; at: number }
  | { type: 'SESSION/RESET' };

/**
 * Тонкий адаптер: экшен UI → метод Game. Вся логика переходов живёт в самом классе,
 * сложность берётся из настроек только там, где она реально нужна (старт/ресет).
 */
export function reduce(game: Game, action: SessionAction, difficulty: DifficultyId): Game {
  switch (action.type) {
    case 'RUN/START':
      return GameClass.start(action.seed, difficulty, action.at);
    case 'PROBLEM/ANSWER':
      return game.answer(action.value, action.at);
    case 'RUN/SURRENDER':
      return game.surrender(action.at);
    case 'SESSION/RESET':
      return GameClass.idle(difficulty);
  }
}
