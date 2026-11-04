export const texts = {
  playerLevel: (n: number) => `ты, ур. ${n}`,
  monsterLevel: (n: number) => `ур. ${n}`,
  active: 'цель',
  packSize: (n: number) => `мобов в пачке: ${n}`,
} as const;
