import type { Game } from './entities/Game';
import { Game as GameClass } from './entities/Game';

export type SessionAction =
  | { type: 'RUN/START'; seed: number; at: number }
  | { type: 'PROBLEM/ANSWER'; value: number; at: number }
  | { type: 'RUN/SURRENDER'; at: number }
  | { type: 'RUN/TICK'; at: number }
  | { type: 'RUN/FLOOR_TIMEOUT'; at: number }
  | { type: 'RUN/USE_ITEM'; itemIndex: number; at: number }
  | { type: 'RUN/OPEN_CHEST'; chestIndex: number; at: number }
  | { type: 'RUN/SKIP_CHESTS'; at: number }
  | { type: 'SESSION/RESET' };

/**
 * Тонкий адаптер: экшен UI → метод Game. Вся логика переходов живёт в самом классе.
 */
export function reduce(game: Game, action: SessionAction): Game {
  switch (action.type) {
    case 'RUN/START':
      return GameClass.start(action.seed, action.at);
    case 'PROBLEM/ANSWER':
      return game.answer(action.value, action.at);
    case 'RUN/SURRENDER':
      return game.surrender(action.at);
    case 'RUN/TICK':
      return game.tick(action.at);
    case 'RUN/FLOOR_TIMEOUT':
      return game.floorTimeout(action.at);
    case 'RUN/USE_ITEM':
      return game.useItem(action.itemIndex, action.at);
    case 'RUN/OPEN_CHEST':
      return game.openChest(action.chestIndex, action.at);
    case 'RUN/SKIP_CHESTS':
      return game.skipChests(action.at);
    case 'SESSION/RESET':
      return GameClass.idle();
  }
}
