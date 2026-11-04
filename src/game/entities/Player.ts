/** Сколько этажей действует одно отравление (обновляется каждым новым ударом яда) */
export const POISON_DURATION_FLOORS = 3;

export interface PoisonState {
  /** сколько яда накоплено: столько секунд срезается с локального таймера ответа */
  stacks: number;
  remainingFloors: number;
}

export interface PlayerJSON {
  aden: number;
  hp: number;
  maxHp: number;
  shield: number;
  poison: PoisonState | null;
}

export interface HitResult {
  player: Player;
  /** true — урон коснулся HP (только в этом случае применяется яд; решает Game) */
  touchedHp: boolean;
}

/** Игрок: HP, щит-пластины, яд. Все вычисления — методами класса, без мутаций. */
export class Player {
  constructor(
    readonly aden: number = 0,
    readonly hp: number = 3,
    readonly maxHp: number = 3,
    readonly shield: number = 0,
    readonly poison: PoisonState | null = null,
  ) {}

  awardAden(amount = 1): Player {
    return new Player(this.aden + amount, this.hp, this.maxHp, this.shield, this.poison);
  }

  /**
   * Удар: сначала щит, переполнение — в HP. Инвариант яда живёт в Game:
   * яд применяется тогда и только тогда, когда touchedHp === true.
   */
  takeHit(damage: number): HitResult {
    const absorbed = Math.min(this.shield, damage);
    const hpDamage = damage - absorbed;
    const player = new Player(
      this.aden,
      Math.max(0, this.hp - hpDamage),
      this.maxHp,
      this.shield - absorbed,
      this.poison,
    );
    return { player, touchedHp: hpDamage > 0 };
  }

  /** +1 яда за каждое отравляющее касание HP; длительность обновляется */
  applyPoison(): Player {
    const poison: PoisonState = {
      stacks: (this.poison?.stacks ?? 0) + 1,
      remainingFloors: POISON_DURATION_FLOORS,
    };
    return new Player(this.aden, this.hp, this.maxHp, this.shield, poison);
  }

  /** Смена этажа: яд выдыхается */
  tickPoisonFloor(): Player {
    if (!this.poison) return this;
    const remainingFloors = this.poison.remainingFloors - 1;
    if (remainingFloors <= 0) {
      return new Player(this.aden, this.hp, this.maxHp, this.shield, null);
    }
    return new Player(this.aden, this.hp, this.maxHp, this.shield, { ...this.poison, remainingFloors });
  }

  clearPoison(): Player {
    if (!this.poison) return this;
    return new Player(this.aden, this.hp, this.maxHp, this.shield, null);
  }

  heal(amount: number | 'full'): Player {
    const hp = amount === 'full' ? this.maxHp : Math.min(this.maxHp, this.hp + amount);
    return new Player(this.aden, hp, this.maxHp, this.shield, this.poison);
  }

  addShield(count = 1): Player {
    return new Player(this.aden, this.hp, this.maxHp, this.shield + count, this.poison);
  }

  get isDead(): boolean {
    return this.hp <= 0;
  }

  /** Сколько секунд срежет яд с локального таймера */
  get poisonSeconds(): number {
    return this.poison?.stacks ?? 0;
  }

  toJSON(): PlayerJSON {
    return { aden: this.aden, hp: this.hp, maxHp: this.maxHp, shield: this.shield, poison: this.poison };
  }

  static fromJSON(data: PlayerJSON): Player {
    return new Player(data.aden, data.hp, data.maxHp, data.shield, data.poison);
  }
}
