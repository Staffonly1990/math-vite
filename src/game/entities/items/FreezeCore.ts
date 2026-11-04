import { Item } from './Item';
import type { ItemJSON } from './Item';

export interface FreezeCoreJSON extends ItemJSON {
  kind: 'freeze';
}

/** Ядро заморозки: замораживает мир (лаву и таймеры), игрок продолжает действовать */
export class FreezeCore extends Item {
  readonly kind = 'freeze' as const;
  readonly title = 'Ядро заморозки';
  readonly icon = '❄️';

  constructor(readonly powerMs = 5_000) {
    super();
  }

  toJSON(): FreezeCoreJSON {
    return { kind: this.kind };
  }

  static fromJSON(_data: FreezeCoreJSON): FreezeCore {
    return new FreezeCore();
  }
}
