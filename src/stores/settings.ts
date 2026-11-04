import { Store } from '@tanstack/store';

export type InputMode = 'choice' | 'input';

export interface SettingsState {
  inputMode: InputMode;
}

export const settingsStore = new Store<SettingsState>({
  inputMode: 'choice',
});

export function setInputMode(inputMode: InputMode): void {
  settingsStore.setState((s) => ({ ...s, inputMode }));
}
