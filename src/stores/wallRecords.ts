import { Store } from '@tanstack/store';

const STORAGE_KEY = 'math:wall-best-level';

function load(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

interface WallRecordsState {
  /** лучший пиковый уровень за все забеги */
  best: number | null;
}

export const wallRecordsStore = new Store<WallRecordsState>({ best: load() });

/** Зафиксировать пик уровня — рекорд обновляется на лету, переживает закрытие браузера */
export function submitWallPeak(peak: number): void {
  const { best } = wallRecordsStore.state;
  if (best !== null && peak <= best) return;
  wallRecordsStore.setState(() => ({ best: peak }));
  try {
    localStorage.setItem(STORAGE_KEY, String(peak));
  } catch {
    // приватный режим / localStorage недоступен — рекорд живёт до перезагрузки
  }
}
