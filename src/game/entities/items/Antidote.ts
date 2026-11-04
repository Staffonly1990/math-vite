import { Item } from './Item';
import type { ItemJSON } from './Item';

export interface AntidoteJSON extends ItemJSON {
  kind: 'antidote';
}

/** Бутыль против яда: снимает яд (сила — задел, сейчас — весь) */
export class Antidote extends Item {
  readonly kind = 'antidote' as const;
  readonly title = 'Бутыль против яда';
  readonly icon = '🍶';

  constructor(readonly power: number | 'all' = 'all') {
    super();
  }

  toJSON(): AntidoteJSON {
    return { kind: this.kind };
  }

  static fromJSON(_data: AntidoteJSON): Antidote {
    return new Antidote();
  }
}
