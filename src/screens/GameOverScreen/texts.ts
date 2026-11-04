export const texts = {
  titleWrong: 'Ошибка. Башня ухмыляется.',
  titleSurrender: 'Сбежал. Классика жанра.',
  adenEarnedWrong: 'адены насобирал',
  adenEarnedSurrender: 'адены едва унёс',
  solved: 'примеров пережил',
  bestStreak: 'серия без косяков',
  time: 'продержался',
  difficulty: (label: string) => `сложность: ${label}`,
  streakMark: (n: number) => `🔥 ${n}`,
  restart: 'Реабилитироваться',
  toMenu: 'Уползти в город',
  noTime: '—',
} as const;
