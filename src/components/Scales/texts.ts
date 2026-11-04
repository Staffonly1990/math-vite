export const texts = {
  hp: (n: number) => `♥ ${n}`,
  shield: (n: number) => `🛡 ${n}`,
  lava: (n: number) => `лава ${n}с`,
  answer: (n: number) => `${n}с`,
  lavaLabel: 'лава',
  answerLabel: 'время на ответ',
  poisonLabel: 'яд',
} as const;
