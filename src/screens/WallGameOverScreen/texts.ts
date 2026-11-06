export const texts = {
  titleWrong: 'Разбился об стену. Бывает.',
  titleTimeout: 'Не успел. Стена оказалась быстрее.',
  titleLava: 'Лава догнала. Как предсказуемо.',
  titleSurrender: 'Сбежал. Классика жанра.',
  adenEarned: 'адены заработано',
  solved: 'стен пройдено',
  bestStreak: 'лучшая серия',
  maxSpeed: 'макс. скорость',
  speed: (n: number) => `×${n.toFixed(1)}`,
  restart: 'Реабилитироваться',
  toMenu: 'Уползти в город',
} as const;
