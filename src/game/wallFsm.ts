import type { WallGame } from './wall/WallGame';
import { WallGame as WallGameClass } from './wall/WallGame';

export type WallAction =
  | { type: 'WALL/START'; seed: number; at: number }
  | { type: 'WALL/TAP'; cellIndex: number; at: number }
  | { type: 'WALL/TICK'; at: number }
  | { type: 'WALL/SURRENDER'; at: number }
  | { type: 'WALL/RESET' };

export function reduce(game: WallGame, action: WallAction): WallGame {
  switch (action.type) {
    case 'WALL/START':
      return WallGameClass.start(action.seed, action.at);
    case 'WALL/TAP':
      return game.tapCell(action.cellIndex, action.at);
    case 'WALL/TICK':
      return game.tick(action.at);
    case 'WALL/SURRENDER':
      return game.surrender();
    case 'WALL/RESET':
      return WallGameClass.idle();
  }
}
