export const texts = {
  count: (n: number) => `×${n}`,
  poisoned: '☠',
  pips: (hp: number, maxHp: number) => '●'.repeat(hp) + '○'.repeat(Math.max(0, maxHp - hp)),
} as const;
