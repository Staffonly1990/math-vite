export interface PlayerJSON {
  aden: number;
  hp: number;
  maxHp: number;
}

/** Игрок. Статы и способности будут расти здесь; все вычисления — методами класса. */
export class Player {
  constructor(
    readonly aden: number = 0,
    readonly hp: number = 1,
    readonly maxHp: number = 1,
  ) {}

  awardAden(amount = 1): Player {
    return new Player(this.aden + amount, this.hp, this.maxHp);
  }

  takeDamage(damage = 1): Player {
    return new Player(this.aden, Math.max(0, this.hp - damage), this.maxHp);
  }

  heal(amount = 1): Player {
    return new Player(this.aden, Math.min(this.maxHp, this.hp + amount), this.maxHp);
  }

  get isDead(): boolean {
    return this.hp <= 0;
  }

  toJSON(): PlayerJSON {
    return { aden: this.aden, hp: this.hp, maxHp: this.maxHp };
  }

  static fromJSON(data: PlayerJSON): Player {
    return new Player(data.aden, data.hp, data.maxHp);
  }
}
