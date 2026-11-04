export const texts = {
  correctAnswerIs: (answer: number) => `Правильный ответ: ${answer}`,
  surrenderButton: 'Сдаться',
  frozen: (n: number) => `❄ мир заморожен: ${n}с`,
  answerSeconds: (n: number) => `${n}с`,
} as const;
