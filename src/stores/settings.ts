import { Store } from '@tanstack/store';
import type { DifficultyId } from '@/game/difficulty';

export type InputMode = 'choice' | 'input';

export interface SettingsState {
  difficulty: DifficultyId;
  inputMode: InputMode;
}

export const settingsStore = new Store<SettingsState>({
  difficulty: 'easy',
  inputMode: 'choice',
});

export function setDifficulty(difficulty: DifficultyId): void {
  settingsStore.setState((s) => ({ ...s, difficulty }));
}

export function setInputMode(inputMode: InputMode): void {
  settingsStore.setState((s) => ({ ...s, inputMode }));
}
