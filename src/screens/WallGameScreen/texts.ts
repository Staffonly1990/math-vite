export const texts = {
  aden: (n: number, threshold: number) => `адены ${n}/${threshold}`,
  peak: (n: number) => `пик ур.${n}`,
  level: (n: number) => `ур.${n}`,
  levelUp: (n: number) => `УРОВЕНЬ ${n}`,
  toMenuBtn: 'Меню',
  roadLabel: 'Вертикальная трасса со стенами-ответами, очередью и зоной риска',
  zone2: '×2',
  go: 'ГО!',
  arrowUp: '▲',
  arrowDown: '▼',
} as const;
