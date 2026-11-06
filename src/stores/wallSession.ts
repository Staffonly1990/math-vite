import { Store } from '@tanstack/store';
import { WallGame } from '@/game/wall/WallGame';
import { reduce } from '@/game/wallFsm';
import type { WallAction } from '@/game/wallFsm';
import { newSeed } from '@/lib/random';

export const wallStore = new Store<{ game: WallGame }>({ game: WallGame.idle() });

export function wallDispatch(action: WallAction): void {
  wallStore.setState((s) => ({ game: reduce(s.game, action) }));
}

export function startWallRun(): void {
  wallDispatch({ type: 'WALL/START', seed: newSeed(), at: Date.now() });
}
