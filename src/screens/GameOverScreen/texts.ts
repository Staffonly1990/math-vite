export const texts = {
  titleWrong: 'Ошибка. Башня ухмыляется.',
  titleSurrender: 'Сбежал. Классика жанра.',
  adenEarnedWrong: 'адены насобирал',
  adenEarnedSurrender: 'адены едва унёс',
  solved: 'дверей открыл',
  bestStreak: 'серия без косяков',
  time: 'продержался',
  floorReached: (n: number) => `дошёл до этажа ${n}`,
  streakMark: (n: number) => `🔥 ${n}`,
  restart: 'Реабилитироваться',
  toMenu: 'Уползти в город',
  noTime: '—',
} as const;
